# Infrastructure as Code — proops2026

Terraform infrastructure for the Helpdesk microservices platform on AWS EKS.

---

## Architecture Overview

```
INTERNET
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  AWS VPC  10.0.0.0/16  (ap-northeast-1)                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  PUBLIC SUBNETS  10.0.1.0/24 · 10.0.2.0/24              │   │
│  │  [Internet Gateway]          [NAT Gateway + Elastic IP]  │   │
│  │  ↑ inbound traffic                ↑ outbound for nodes   │   │
│  └─────────────────────────────────────────────────────────-┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  PRIVATE SUBNETS  10.0.11.0/24 · 10.0.12.0/24           │   │
│  │  EKS Node (1a)        EKS Node (1c)                      │   │
│  │  ┌─────────────┐    ┌─────────────┐                      │   │
│  │  │ app pods    │    │ app pods    │ → NAT → ECR/AWS APIs  │   │
│  │  │ prometheus  │    │ argocd      │                      │   │
│  │  └─────────────┘    └─────────────┘                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │ VPC-internal only                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  DATA SUBNETS  10.0.21.0/24 · 10.0.22.0/24              │   │
│  │  ❌ No internet route                                    │   │
│  │  [RDS PostgreSQL users]  [RDS PostgreSQL tickets]        │   │
│  │  [ElastiCache Redis]                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

AWS Secrets Manager ← stores all credentials
ECR                 ← stores Docker images
```

---

## Folder Structure

```
iac/
├── bootstrap/                  ← Run ONCE to create S3 state backend
│   └── main.tf
│
├── modules/                    ← Reusable modules (no state, no providers)
│   ├── vpc/                    ← VPC, subnets, NAT Gateway, route tables
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── eks/                    ← EKS cluster, node group, IAM, OIDC, IRSA
│   │   ├── main.tf
│   │   ├── iam.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── rds/                    ← RDS PostgreSQL (users + tickets)
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── elasticache/            ← ElastiCache Redis
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── secrets/                ← AWS Secrets Manager
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
│
└── environments/
    └── lab/                    ← Active environment
        ├── backend.tf          ← S3 remote state config
        ├── versions.tf         ← Provider config (aws, kubernetes, helm, tls)
        ├── main.tf             ← Calls all modules + Helm releases
        ├── variables.tf
        ├── outputs.tf
        └── terraform.tfvars.example
```

> **`iac/eks/`** — legacy flat structure, kept for reference. Do not use for new deployments.

---

## What Each Module Creates

### `modules/vpc`
| Resource | Description |
|----------|-------------|
| `aws_vpc` | VPC 10.0.0.0/16 with DNS enabled |
| `aws_subnet` x6 | 2 public, 2 private, 2 data subnets across 1a/1c |
| `aws_internet_gateway` | Internet access for public subnets |
| `aws_eip` + `aws_nat_gateway` | Outbound internet for private nodes |
| `aws_route_table` x3 | public → IGW, private → NAT, data → none |

### `modules/eks`
| Resource | Description |
|----------|-------------|
| `aws_eks_cluster` | Kubernetes 1.30 control plane |
| `aws_eks_node_group` | 2–5x t3.medium SPOT nodes in private subnets |
| `aws_iam_role` x2 | Cluster role + Node role |
| `aws_iam_openid_connect_provider` | OIDC for IRSA |
| `aws_iam_role` (external-secrets) | IRSA: read Secrets Manager |
| `aws_iam_role` (cluster-autoscaler) | IRSA: scale EC2 Auto Scaling Groups |

### `modules/rds`
| Resource | Description |
|----------|-------------|
| `aws_security_group` | Port 5432, only from EKS cluster SG |
| `aws_db_subnet_group` | Uses data subnets (no internet) |
| `aws_db_instance` (users) | PostgreSQL 15, users_db |
| `aws_db_instance` (tickets) | PostgreSQL 15, tickets_db |

### `modules/elasticache`
| Resource | Description |
|----------|-------------|
| `aws_security_group` | Port 6379, only from EKS cluster SG |
| `aws_elasticache_subnet_group` | Uses data subnets |
| `aws_elasticache_cluster` | Redis 7.0 |

### `modules/secrets`
| Resource | Description |
|----------|-------------|
| `aws_secretsmanager_secret` (db-credentials) | DATABASE_URL_USERS + DATABASE_URL_TICKETS |
| `aws_secretsmanager_secret` (redis-credentials) | REDIS_URL |
| `aws_secretsmanager_secret` (jwt-secret) | JWT_SECRET |

### Helm releases (in `environments/lab/main.tf`)
| Release | Chart | Namespace | Purpose |
|---------|-------|-----------|---------|
| nginx-ingress | ingress-nginx 4.10.0 | ingress-nginx | Routes external traffic into cluster |
| cluster-autoscaler | cluster-autoscaler 9.37.0 | kube-system | Scales EC2 nodes up/down |
| external-secrets | external-secrets 0.9.20 | external-secrets | Syncs Secrets Manager → K8s Secrets |

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Terraform | >= 1.0 | https://developer.hashicorp.com/terraform/install |
| AWS CLI | >= 2.0 | https://aws.amazon.com/cli |
| kubectl | >= 1.28 | https://kubernetes.io/docs/tasks/tools |

AWS credentials configured:
```bash
aws configure
# or
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_DEFAULT_REGION=ap-northeast-1
```

---

## Deployment Guide

### Step 0 — Bootstrap (run once, ever)

Creates the S3 bucket and DynamoDB table that store Terraform state.

```bash
cd iac/bootstrap
terraform init
terraform apply
```

Expected output:
```
s3_bucket      = "proops2026-tfstate"
dynamodb_table = "proops2026-tfstate-lock"
```

---

### Step 1 — Configure secrets

```bash
cd iac/environments/lab
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
postgres_users_password   = "your-strong-password-here"
postgres_tickets_password = "another-strong-password"
jwt_secret                = "your-jwt-secret-min-32-chars"
```

> `terraform.tfvars` is gitignored. Never commit it.

---

### Step 2 — Init and create VPC + EKS

```bash
terraform init
terraform apply -target=module.vpc -target=module.eks
```

**Why two steps?**
The `kubernetes` and `helm` providers need the EKS cluster endpoint to initialise.
The cluster doesn't exist yet on the first run, so `-target` creates it first.

What gets created in this step:
- VPC, subnets, NAT Gateway (~4 min)
- EKS cluster (~12 min)
- IAM roles, OIDC provider, IRSA roles (~1 min)
- Worker nodes — 2x t3.medium SPOT (~8 min)

**Total: ~25 minutes**

---

### Step 3 — Create everything else

```bash
terraform apply
```

What gets created:
- RDS PostgreSQL (users + tickets) (~10 min)
- ElastiCache Redis (~5 min)
- AWS Secrets Manager secrets (~1 min)
- Helm: NGINX Ingress, Cluster Autoscaler, External Secrets Operator (~3 min)

**Total: ~15 minutes**

---

### Step 4 — Connect kubectl

```bash
aws eks update-kubeconfig \
  --name project-quyet-lab \
  --region ap-northeast-1

kubectl get nodes
# NAME                                          STATUS   ROLES    AGE
# ip-10-0-11-xxx.ap-northeast-1.compute.internal   Ready    <none>   5m
# ip-10-0-12-xxx.ap-northeast-1.compute.internal   Ready    <none>   5m
```

Or use the Terraform output:
```bash
terraform output kubeconfig_command
```

---

### Step 5 — Verify platform pods

```bash
kubectl get pods -n ingress-nginx
kubectl get pods -n kube-system | grep autoscaler
kubectl get pods -n external-secrets
```

All pods should be `Running`.

---

### Step 6 — Deploy app services

After infrastructure is ready, deploy the 5 microservices from the k8s repo:

```bash
cd C:/Data/AIOps/k8s

helm install user-service         helm/service-template/ -f helm/values/user-service.yaml         -n default
helm install ticket-service       helm/service-template/ -f helm/values/ticket-service.yaml       -n default
helm install notification-service helm/service-template/ -f helm/values/notification-service.yaml -n default
helm install api-gateway          helm/service-template/ -f helm/values/api-gateway.yaml          -n default
helm install frontend             helm/service-template/ -f helm/values/frontend.yaml             -n default
```

---

## Outputs Reference

After `terraform apply`, useful values are printed:

| Output | Description |
|--------|-------------|
| `kubeconfig_command` | Command to connect kubectl |
| `rds_users_endpoint` | RDS host for user-service |
| `rds_tickets_endpoint` | RDS host for ticket-service |
| `redis_endpoint` | ElastiCache host |
| `secrets_manager_paths` | Secret names in Secrets Manager |
| `external_secrets_role_arn` | IAM role ARN for ESO |
| `cluster_autoscaler_role_arn` | IAM role ARN for Cluster Autoscaler |

View any time:
```bash
terraform output
terraform output rds_users_endpoint
```

---

## Cost Estimate (ap-northeast-1)

| Resource | Type | Cost/month |
|----------|------|-----------|
| EKS cluster | Control plane | ~$73 |
| EC2 nodes | 2x t3.medium SPOT | ~$25 |
| NAT Gateway | 1x | ~$33 |
| RDS PostgreSQL | 2x db.t3.micro | ~$30 |
| ElastiCache Redis | 1x cache.t3.micro | ~$12 |
| Secrets Manager | 3 secrets | ~$1 |
| **Total** | | **~$174/month** |

> To reduce cost: destroy the cluster when not in use (`terraform destroy`).
> EKS control plane alone costs $2.40/day even with no nodes.

---

## Destroy (cleanup)

```bash
cd iac/environments/lab
terraform destroy
```

> This deletes everything **except** the S3 bucket and DynamoDB table
> (they are protected by `prevent_destroy = true` in bootstrap).

To also delete the backend:
```bash
cd iac/bootstrap
terraform destroy
```

---

## Common Issues

### `Error: cluster not found` during `terraform apply`
**Cause:** Running full `apply` before cluster exists.
**Fix:** Run Step 2 first (`-target=module.vpc -target=module.eks`), then `terraform apply`.

### `Error: InvalidParameterException: DB subnet group doesn't cover all AZs`
**Cause:** RDS requires subnets in at least 2 AZs — already handled by `data_1a` and `data_1c`.
**Fix:** Verify both data subnets exist: `terraform state list | grep data`.

### `Nodes not joining cluster`
**Cause:** `aws-auth` ConfigMap not configured.
**Fix:** Check `aws_eks_access_entry` was created: `terraform state show module.eks.aws_eks_access_entry.node_group`.

### `Helm release timeout`
**Cause:** Nodes not ready when Helm tries to schedule pods.
**Fix:** Wait for nodes to be `Ready`, then re-run `terraform apply`.

### `Error: S3 bucket already exists`
**Cause:** S3 bucket names are globally unique. `proops2026-tfstate` may be taken.
**Fix:** Change the bucket name in `bootstrap/main.tf` and `environments/lab/backend.tf`.

---

## Security Notes

- Worker nodes have **no public IP** — they run in private subnets.
- RDS and ElastiCache are in **data subnets with no internet route**.
- Security groups restrict DB access to **EKS cluster SG only**.
- All passwords stored in **AWS Secrets Manager**, never in code.
- Pods access AWS via **IRSA** (per-service IAM roles), not the node's role.
- `terraform.tfvars` is **gitignored** — never commit secrets.
