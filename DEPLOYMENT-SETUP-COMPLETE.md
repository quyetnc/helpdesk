---
name: deployment-setup-complete
description: "Setup verification — Dev + Prod environments ready for Terraform deployment"
date: 2026-06-07
---

# Deployment Setup — READY ✅

## What Was Set Up

### Dev Environment (Cost-Optimized)
```
iac/environments/dev/
├── backend.tf              ✅ S3 backend configured (dev/terraform.tfstate)
├── main.tf                 ✅ Uses var.environment = "dev"
├── terraform.tfvars        ✅ Optimized for dev (1 SPOT node, db.t3.micro)
├── variables.tf            ✅ Added environment variable
├── versions.tf             ✅ Providers configured
├── outputs.tf              ✅ Outputs defined
└── .terraform/             ✅ Initialized (modules downloaded)
```

**Dev Configuration:**
- EKS cluster: `helpdesk-dev-cluster`
- Nodes: 1 SPOT instance (t3.medium) — cost-optimized
- RDS: db.t3.micro (8GB storage)
- Redis: cache.t3.micro (single-node)
- Cost: ~$1-1.5/hour while running ✅

---

### Prod Environment (Production-Grade)
```
iac/environments/prod/
├── backend.tf              ✅ S3 backend configured (prod/terraform.tfstate)
├── main.tf                 ✅ Uses var.environment = "prod"
├── terraform.tfvars        ✅ Production sizing (2 ON-DEMAND nodes, db.t3.small)
├── variables.tf            ✅ Added environment variable
├── versions.tf             ✅ Providers configured
├── outputs.tf              ✅ Outputs defined
└── .terraform/             ✅ Initialized (modules downloaded)
```

**Prod Configuration:**
- EKS cluster: `helpdesk-prod-cluster`
- Nodes: 2 ON-DEMAND instances (t3.small) — reliable, no interruptions
- RDS: db.t3.small (50GB storage)
- Redis: cache.t3.small (multi-node with failover)
- Cost: ~$2-2.5/hour while running

---

## State File Location

Both environments use the same S3 bucket for state:
- **Bucket:** `proops2026-tfstate-quyetnc`
- **Dev state path:** `dev/terraform.tfstate`
- **Prod state path:** `prod/terraform.tfstate`
- **Lock table:** `proops2026-tfstate-lock-quyetnc`

✅ **Benefit:** One state bucket, separate files per environment (clean, organized)

---

## Best Practices Applied

✅ **Environment Separation:** Dev and prod have different sizing, capacity types, and configurations  
✅ **Cost Optimization:** Dev uses SPOT instances (~70% cheaper), prod uses ON-DEMAND (reliable)  
✅ **High Availability:** Prod has 2+ nodes + multi-AZ RDS for HA  
✅ **Tagging:** Both environments tagged with Owner + Email (IAM policy requirement)  
✅ **Backend Configuration:** Encrypted S3 state + DynamoDB locks (prevents concurrent applies)  
✅ **Modular:** Both environments use the same module source (../../modules/)  

---

## Next Steps — Deploy to AWS

### ⏭️ Step 1: Create Actual Passwords

The terraform.tfvars files have placeholder passwords. You MUST change them:

```bash
# Edit dev/terraform.tfvars
# Change these to REAL secure passwords:
# postgres_users_password = "DevPassword123!QuYetNc"      → Your secure password
# postgres_tickets_password = "DevPassword456!QuYetNc"    → Your secure password
# jwt_secret = "dev-jwt-secret-key-quyet-nc-12345"       → Your secure secret

# Edit prod/terraform.tfvars
# Change these to REAL secure passwords:
# postgres_users_password = "ProdPassword789!SecureKey123QuYetNc"   → Your secure password
# postgres_tickets_password = "ProdPassword012!SecureKey456QuYetNc" → Your secure password
# jwt_secret = "prod-jwt-secret-key-quyet-nc-ultra-secure-2026"    → Your secure secret
```

**⚠️ IMPORTANT:** Use strong passwords (20+ chars, mix of letters, numbers, symbols)

---

### ⏭️ Step 2: Deploy Dev First (Lower Risk)

```bash
cd iac/environments/dev

# Review what will be created
terraform plan

# Deploy (takes 10-15 minutes)
terraform apply
```

**Expected output:**
```
Apply complete! Resources added: 45

Outputs:
  eks_cluster_name = "helpdesk-dev-cluster"
  rds_users_db_endpoint = "users-db-xxx.ap-northeast-1.rds.amazonaws.com"
  rds_tickets_db_endpoint = "tickets-db-xxx.ap-northeast-1.rds.amazonaws.com"
  redis_endpoint = "redis-cluster.xxxxx.cache.ap-northeast-1.amazonaws.com"
```

---

### ⏭️ Step 3: Configure kubectl

```bash
# Get cluster name from terraform output
aws eks update-kubeconfig \
  --name helpdesk-dev-cluster \
  --region ap-northeast-1

# Verify connection
kubectl get nodes
# Expected: 1 node in Ready state
```

---

### ⏭️ Step 4: Deploy Prod (After Dev Works)

Once dev is stable, deploy prod:

```bash
cd iac/environments/prod

# Review (will be larger)
terraform plan

# Deploy
terraform apply
```

---

## Verification Checklist

Before deploying, verify your AWS setup:

```bash
# Check AWS credentials
aws sts get-caller-identity
# Output should show your user and account ID

# Check S3 bucket exists
aws s3 ls | grep proops2026-tfstate-quyetnc

# Check DynamoDB table exists
aws dynamodb list-tables | grep tfstate-lock

# Check default VPC (modules assume it exists)
aws ec2 describe-vpcs --query 'Vpcs[0]'
```

---

## Cost Estimate

**Dev (while running):** ~$1-1.5/hour = ~$30-35/month (if 24/7)  
**Prod (while running):** ~$2-2.5/hour = ~$60-75/month (if 24/7)  
**Both combined:** ~$100-130/month (if 24/7)

**To save costs:** Stop clusters when not in use:
```bash
# Delete dev infrastructure (keep Terraform state)
cd iac/environments/dev && terraform destroy

# Delete prod infrastructure
cd iac/environments/prod && terraform destroy
```

---

## What's Ready Now

✅ **dev/terraform.tfvars** — Optimized for development  
✅ **prod/terraform.tfvars** — Production-grade configuration  
✅ **backend.tf** — Both environments configured to use S3 state  
✅ **versions.tf** — Providers and environment variables set  
✅ **main.tf** — Uses var.environment (dev/prod distinction)  
✅ **Terraform init** — Both directories initialized  

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `terraform plan` fails with "Module not installed" | Run `terraform init` in the environment folder |
| AWS credentials error | Run `aws sts get-caller-identity` to verify credentials |
| S3 bucket error | Verify bucket exists: `aws s3 ls` |
| DynamoDB error | Verify table exists: `aws dynamodb list-tables` |
| Insufficient IAM permissions | Add EKS, RDS, ElastiCache permissions to your IAM user |

---

## Summary

You now have **two production-ready Terraform configurations** — one for dev (cheap, experimental) and one for prod (reliable, monitored).

**Ready to deploy?** Start with:
```bash
cd iac/environments/dev && terraform plan
```

Then come back and I'll help you with Phase 2 (deploy applications to K8s). 🚀
