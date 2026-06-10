---
name: aws-deployment-plan
description: "Step-by-step plan to deploy helpdesk project to AWS - Phases 1-3 (2-3 days)"
metadata:
  date: 2026-06-07
  target_completion: 2026-06-10
  status: Ready to start
---

# AWS Deployment Plan — Phases 1-3

**Goal:** Get your helpdesk system running on AWS (EKS + RDS + Redis + CI/CD verified)  
**Timeline:** 2-3 days (40-50 hours effort)  
**Success Criteria:** Real PR → Built Image → Deployed Pod with matching SHA

---

## Phase 1: AWS Infrastructure Deployment (1-2 days)

### Goal
Get EKS cluster, RDS databases, and Redis running in AWS.

### Prerequisites
- ✅ AWS account with sufficient permissions
- ✅ AWS CLI installed and configured
- ✅ Terraform installed (`terraform version` shows v1.0+)
- ✅ kubectl installed
- ✅ IAM permissions to create: EKS, RDS, ElastiCache, VPC, S3, DynamoDB

### Step 1.1: Verify AWS Credentials

```bash
# Test your AWS credentials
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "...",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/your-name"
# }

# Set default region
export AWS_DEFAULT_REGION=us-east-1
aws configure set region us-east-1
```

**✏️ Your AWS Account ID:** ________________  
**✏️ Your AWS Region:** ________________ (default: us-east-1)

---

### Step 1.2: Create S3 Bucket for Terraform State

Terraform needs a central place to store infrastructure state. Create it manually first (bootstrap pattern).

```bash
# Create state bucket (MUST be globally unique)
aws s3api create-bucket \
  --bucket proops2026-tfstate-quyetnc \
  --region us-east-1

# Enable versioning (prevent state corruption)
aws s3api put-bucket-versioning \
  --bucket proops2026-tfstate-quyetnc \
  --versioning-configuration Status=Enabled

# Block public access (security)
aws s3api put-public-access-block \
  --bucket proops2026-tfstate-quyetnc \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Verify
aws s3 ls | grep tfstate
```

**✏️ Check:** Bucket created? (yes/no) ________________

---

### Step 1.3: Run Terraform Bootstrap

The `iac/bootstrap/` folder creates the DynamoDB lock table (prevents concurrent Terraform applies).

```bash
# Navigate to bootstrap
cd iac/bootstrap

# Initialize Terraform (creates .terraform/ and lock file)
terraform init

# Review what will be created
terraform plan

# Apply (creates DynamoDB table)
terraform apply

# Verify
aws dynamodb list-tables | grep tfstate
```

**Expected output:**
```
Outputs:

state_bucket_name = "proops2026-tfstate-quyetnc"
lock_table_name = "proops2026-tfstate-lock-quyetnc"
```

**✏️ Check:** Bootstrap applied? (yes/no) ________________

---

### Step 1.4: Create dev Environment from Lab Template

The `lab/` environment is a template. Copy it to create `dev/`.

```bash
# Navigate to environments folder
cd iac/environments

# Copy lab → dev
cp -r lab dev

# Edit dev/terraform.tfvars to customize for dev
cat dev/terraform.tfvars
# Change: environment = "dev"
# Change: cluster_version (optional, use same as lab)
# Change: node_instance_types = ["t3.medium"] (smaller for dev)

# Edit dev/versions.tf to add backend config (state location)
# Add to terraform block:
# backend "s3" {
#   bucket         = "proops2026-tfstate-quyetnc"
#   key            = "dev/terraform.tfstate"
#   region         = "us-east-1"
#   encrypt        = true
#   dynamodb_table = "proops2026-tfstate-lock-quyetnc"
# }
```

**✏️ Completed:** dev/ folder created with custom tfvars? (yes/no) ________________

---

### Step 1.5: Deploy Dev Infrastructure

```bash
# Navigate to dev environment
cd iac/environments/dev

# Initialize Terraform (points to S3 backend)
terraform init

# Review infrastructure
terraform plan

# WARNING: This will create EKS cluster (5-10 minutes) + RDS + ElastiCache
# Cost: ~$50-80/day while running
terraform apply

# Wait for completion (might take 10-15 minutes)
# Watch the logs for:
# - "aws_eks_cluster.main: Creating..."
# - "aws_db_instance.users_db: Creating..."
# - "aws_elasticache_cluster.redis: Creating..."
```

**What gets created:**
- EKS cluster (1 master, 2 worker nodes)
- RDS PostgreSQL (2 databases: users_db, tickets_db)
- ElastiCache Redis (single-node)
- VPC with public/private/data subnets
- Security groups, IAM roles, etc.

**Cost estimate:** ~$2-3/hour while running

**✏️ Check:** `terraform apply` completed successfully? (yes/no) ________________

---

### Step 1.6: Configure kubectl

```bash
# Get EKS cluster name
terraform output eks_cluster_name
# Expected: helpdesk-dev-cluster

# Configure kubectl to access your cluster
aws eks update-kubeconfig \
  --name helpdesk-dev-cluster \
  --region us-east-1

# Verify connection
kubectl get nodes
# Expected: 2 nodes in Ready state

kubectl get pods -A
# Expected: core-dns, kube-proxy, etc. running
```

**✏️ Check:** kubectl connected to EKS? (yes/no) ________________

---

### Step 1.7: Verify Infrastructure

```bash
# Check EKS cluster
aws eks describe-cluster --name helpdesk-dev-cluster --query 'cluster.status'
# Expected: ACTIVE

# Check RDS databases
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus]'
# Expected: users_db (available), tickets_db (available)

# Check RDS endpoints (you'll need these for K8s ConfigMaps)
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,Endpoint.Address]'
# Record these for Step 2

# Check ElastiCache
aws elasticache describe-cache-clusters --query 'CacheClusters[*].[CacheNodeType,CacheClusterStatus]'
# Expected: cache.t3.micro (available)
```

**✏️ Record these for Step 2:**
- **Users DB endpoint:** ________________
- **Tickets DB endpoint:** ________________
- **Redis endpoint:** ________________

---

## Phase 2: Deploy Applications to Kubernetes (1 day)

### Goal
Build Docker images, push to GHCR, deploy K8s manifests, verify pods running.

### Step 2.1: Authenticate with GitHub Container Registry (GHCR)

```bash
# Create GitHub Personal Access Token (PAT)
# Go to: https://github.com/settings/tokens
# Create token with: read:packages, write:packages
# Copy token to clipboard

# Log in to GHCR
export GITHUB_TOKEN=ghp_your_token_here
echo $GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin

# Verify
docker pull ghcr.io/github/super-linter:latest
# Should succeed without "authentication required" error
```

**✏️ GHCR authenticated? (yes/no) ________________

---

### Step 2.2: Build and Push Docker Images

For each service, build locally and push to GHCR:

```bash
# Set variables
export GITHUB_OWNER=quyetnc  # ✏️ Change to YOUR username
export IMAGE_TAG=latest
export REGION=us-east-1

# ===== USER SERVICE =====
cd user-service

# Build
docker build -t ghcr.io/$GITHUB_OWNER/helpdesk-user-service:$IMAGE_TAG .

# Push
docker push ghcr.io/$GITHUB_OWNER/helpdesk-user-service:$IMAGE_TAG

# Verify
docker pull ghcr.io/$GITHUB_OWNER/helpdesk-user-service:$IMAGE_TAG

cd ..

# ===== TICKET SERVICE =====
cd ticket-service
docker build -t ghcr.io/$GITHUB_OWNER/helpdesk-ticket-service:$IMAGE_TAG .
docker push ghcr.io/$GITHUB_OWNER/helpdesk-ticket-service:$IMAGE_TAG
cd ..

# ===== NOTIFICATION SERVICE =====
cd notification-service
docker build -t ghcr.io/$GITHUB_OWNER/helpdesk-notification-service:$IMAGE_TAG .
docker push ghcr.io/$GITHUB_OWNER/helpdesk-notification-service:$IMAGE_TAG
cd ..

# ===== API GATEWAY =====
cd api-gateway
docker build -t ghcr.io/$GITHUB_OWNER/helpdesk-api-gateway:$IMAGE_TAG .
docker push ghcr.io/$GITHUB_OWNER/helpdesk-api-gateway:$IMAGE_TAG
cd ..

# ===== FRONTEND =====
cd frontend
docker build -t ghcr.io/$GITHUB_OWNER/helpdesk-frontend:$IMAGE_TAG .
docker push ghcr.io/$GITHUB_OWNER/helpdesk-frontend:$IMAGE_TAG
cd ..
```

**✏️ Check:** All 5 images pushed to GHCR? (yes/no) ________________

---

### Step 2.3: Update K8s ConfigMaps with Database Endpoints

The K8s manifests reference database endpoints via ConfigMaps. Update them with real values from Phase 1.

```bash
# Edit ConfigMaps with database endpoints from Phase 1
# File: k8s/base/configmaps.yaml

# Add/update:
# user-service-config:
#   DATABASE_HOST: "users-db-endpoint-from-phase-1.us-east-1.rds.amazonaws.com"
#   DATABASE_PORT: "5432"
#   DATABASE_NAME: "users_db"
#   REDIS_HOST: "redis-endpoint.cache.amazonaws.com"

# ticket-service-config:
#   DATABASE_HOST: "tickets-db-endpoint.us-east-1.rds.amazonaws.com"
#   DATABASE_PORT: "5432"
#   DATABASE_NAME: "tickets_db"
```

**✏️ Check:** ConfigMaps updated with real endpoints? (yes/no) ________________

---

### Step 2.4: Update K8s Deployments with Image References

Update the deployment manifests to reference your GHCR images.

```bash
# Edit k8s/base/deployments/user-service.yaml
# Change: image: ghcr.io/[YOUR-OWNER]/helpdesk-user-service:latest

# Edit k8s/base/deployments/ticket-service.yaml
# Change: image: ghcr.io/[YOUR-OWNER]/helpdesk-ticket-service:latest

# Edit k8s/base/deployments/notification-service.yaml
# Change: image: ghcr.io/[YOUR-OWNER]/helpdesk-notification-service:latest

# Edit k8s/base/deployments/api-gateway.yaml
# Change: image: ghcr.io/[YOUR-OWNER]/helpdesk-api-gateway:latest

# Edit k8s/base/deployments/frontend.yaml
# Change: image: ghcr.io/[YOUR-OWNER]/helpdesk-frontend:latest
```

**✏️ Check:** All image refs updated? (yes/no) ________________

---

### Step 2.5: Deploy to Kubernetes

```bash
# Dry run (verify manifests without applying)
kubectl kustomize k8s/overlays/dev/ | head -50

# Deploy
kubectl apply -f <(kubectl kustomize k8s/overlays/dev/)

# Wait for rollout (might take 3-5 minutes)
kubectl rollout status deployment/user-service -n default --timeout=5m
kubectl rollout status deployment/ticket-service -n default --timeout=5m
kubectl rollout status deployment/notification-service -n default --timeout=5m
kubectl rollout status deployment/api-gateway -n default --timeout=5m
kubectl rollout status deployment/frontend -n default --timeout=5m

# Verify all pods running
kubectl get pods -o wide
# Expected: 6 pods (user, ticket, notification, api-gateway, frontend, rabbitmq) in Running state
```

**✏️ Check:** All 6 pods Running? (yes/no) ________________

---

### Step 2.6: Verify Pod Health

```bash
# Check pod logs
kubectl logs -f deployment/user-service
# Expected: "Server listening on port 3000" or similar startup message

# Check pod environment
kubectl describe pod <user-service-pod-name>
# Look for: Image, Env vars, Status: Running

# Test service connectivity
kubectl port-forward svc/user-service 3000:3000 &
curl http://localhost:3000/health
# Expected: 200 OK or health check response
```

**✏️ Check:** Pods healthy and responding? (yes/no) ________________

---

## Phase 3: Test CI/CD End-to-End (1 day)

### Goal
Verify full pipeline: PR → CI build → Image push → K8s deploy with correct SHA.

### Step 3.1: Create a Real PR

```bash
# Create feature branch
git checkout -b feature/test-ci-cd
cd user-service

# Make a trivial change
echo "# Test CI/CD" >> README.md

# Commit and push
git add README.md
git commit -m "test: trigger CI/CD pipeline end-to-end"
git push origin feature/test-ci-cd

# Go to GitHub and open PR
# Expected: PR created with checks pending
```

**✏️ PR URL:** ________________

---

### Step 3.2: Verify PR Checks

```bash
# Go to GitHub PR → Checks tab
# Look for:
# - reusable-app-ci (triggered by pr-opened.yml)
# - Status should be "In Progress" → "Passed"

# Wait for workflow to complete (usually 3-5 minutes)
# Expected output: Image built and pushed to GHCR
```

**✏️ Check:** PR checks passed? (yes/no) ________________

---

### Step 3.3: Find Image SHA

```bash
# Go to GitHub Actions → Last run for user-service pr-opened workflow
# Look for step: "Build and push image"
# Find output: "built-image-sha: sha-abc123def"

# Alternative: Check GHCR directly
# Go to: https://github.com/your-org/helpdesk/pkgs/container/helpdesk-user-service
# Find latest tag with today's date

# Record the SHA
# Example: sha-a1b2c3d4e5f6
```

**✏️ Image SHA from this PR:** ________________

---

### Step 3.4: Merge PR and Verify Deploy

```bash
# Merge the PR on GitHub (click "Merge pull request")
# Expected: pr-merged.yml triggers automatically

# Go to GitHub Actions → Filter by "pr-merged"
# Wait for deploy workflow to complete (might take 3-5 minutes)

# Expected: Workflow runs deploy-dev action
# Artifacts: kubectl apply triggered, pods restarted
```

**✏️ Check:** Deploy workflow succeeded? (yes/no) ________________

---

### Step 3.5: Verify New Pod Image

```bash
# After PR merge and deploy completes
# Verify pod restarted with new image

kubectl get pods -o wide
# Look for user-service pod with recent restart time

kubectl describe pod <new-user-service-pod>
# Find "Image:" field
# Should show: ghcr.io/your-owner/helpdesk-user-service:sha-a1b2c3d4e5f6
#             (matching the SHA from Step 3.3)

# Double-check by comparing SHAs
kubectl describe pod <pod> | grep "Image ID"
# Extract the SHA and compare with PR image SHA
```

**✏️ Check:** Pod running with new image SHA? (yes/no) ________________

---

## Phase Summary Checklist

### Phase 1: Infrastructure ✅
- [ ] AWS credentials verified
- [ ] S3 state bucket created
- [ ] Terraform bootstrap applied
- [ ] dev/ environment created from lab/
- [ ] `terraform apply` completed successfully
- [ ] kubectl configured and connected
- [ ] EKS, RDS, ElastiCache verified in AWS
- [ ] Database endpoints recorded

**Phase 1 Status:** ________________  
**Phase 1 Completion Date:** ________________

---

### Phase 2: Applications ✅
- [ ] GitHub Container Registry (GHCR) authenticated
- [ ] All 5 Docker images built and pushed to GHCR
- [ ] K8s ConfigMaps updated with DB endpoints
- [ ] K8s Deployments updated with image references
- [ ] `kubectl apply` of kustomize overlays succeeded
- [ ] All 6 pods in Running state
- [ ] Pod health checks passing

**Phase 2 Status:** ________________  
**Phase 2 Completion Date:** ________________

---

### Phase 3: CI/CD Verification ✅
- [ ] Real PR created with code change
- [ ] GitHub Actions pr-opened workflow triggered
- [ ] Image built and pushed to GHCR with SHA tag
- [ ] PR checks passed
- [ ] PR merged successfully
- [ ] pr-merged workflow triggered deploy
- [ ] K8s pod restarted with new image
- [ ] Image SHA matches across PR → GHCR → K8s

**Phase 3 Status:** ________________  
**Phase 3 Completion Date:** ________________

---

## When Ready for Day 30

Once all three phases are complete, you'll have:

✅ **Real PR URL** (for Phase 1 trace)  
✅ **GitHub Actions URLs** (for every layer: CI, build, push, deploy)  
✅ **GHCR image with SHA** (for Phase 1 trace)  
✅ **Running K8s pods** with matching image SHA (for Phase 1 kubectl verification)  
✅ **Honest gaps identified** (for Phase 1 gaps section)

Then you can come back and do **Day 30 Phase 1: Integration Trace** with real evidence.

---

## Troubleshooting Quick Links

If something fails, check:

| Component | Issue | Solution |
|-----------|-------|----------|
| Terraform apply fails | IAM permissions | Verify `aws sts get-caller-identity` |
| EKS cluster fails to create | VPC CIDR conflict | Change cluster_name in tfvars |
| RDS fails to create | Multi-AZ requirement | Change instance class or AZs in tfvars |
| kubectl connection fails | EKS cluster not ready | Wait 5-10 min, then retry |
| Pod not starting | Image pull failed | Verify GHCR authentication + image exists |
| Pod timeout | Database not reachable | Verify security groups allow K8s → RDS |
| Workflow doesn't trigger | Branch rules not configured | Check GitHub branch protection rules |

---

**Start with Phase 1 Step 1.1 now. Good luck! 🚀**
