# IaC Complete Map — Understanding Every File

## Bird's Eye View (Big Picture First)

```
iac/
├── bootstrap/              ← Create & manage Terraform state (S3 + DynamoDB)
├── modules/                ← Reusable building blocks (VPC, EKS, RDS, etc.)
├── environments/           ← Deploy targets (lab, dev, test, prod)
├── unrelated/              ← Old code (leave untouched)
```

**The Flow:**
1. **Bootstrap** creates the state bucket
2. **Modules** define reusable infrastructure components
3. **Environments** (like lab) call modules to deploy actual infrastructure

---

## 1. BOOTSTRAP — The Foundation

**Purpose:** Set up Terraform state management (S3 bucket + DynamoDB lock table)

**Files:**
- `bootstrap/main.tf` — Creates S3 bucket and DynamoDB table for storing state

**What it does:**
- Creates `proops2026-tfstate-quyetnc` S3 bucket (stores .tfstate files)
- Creates DynamoDB table `proops2026-tfstate-lock-quyetnc` (prevents concurrent applies)
- Applies tags: Owner + Email (required by IAM policy)

**When to use:**
- Run ONCE at the very beginning (before any environments)
- After this, never touch it again

**Commands:**
```bash
cd iac/bootstrap
terraform init
terraform apply
```

**After bootstrap is done:**
- All other environments will use this S3 bucket to store state
- Each environment has its own .tfstate file path: `lab/terraform.tfstate`, `dev/terraform.tfstate`, etc.

---

## 2. MODULES — Reusable Building Blocks

**Purpose:** Define infrastructure components that can be reused across environments

**6 Modules:**

### Module 1: VPC (Virtual Private Cloud)
**File:** `modules/vpc/`
- **variables.tf** — Input parameters (cluster_name, aws_region, tags)
- **main.tf** — Creates VPC, subnets (public/private/data), IGW, NAT, route tables
- **outputs.tf** — Exports VPC ID, subnet IDs for other modules to use

**Example output:** VPC ID = `vpc-abc123`, subnet IDs for EKS nodes

**Used by:** All environments (vpc comes first in dependency chain)

---

### Module 2: EKS (Kubernetes Cluster)
**File:** `modules/eks/`
- **variables.tf** — Input: cluster_name, version, node config, VPC IDs
- **main.tf** — Creates EKS cluster, node group, access entries
- **iam.tf** — Creates IAM roles for cluster, nodes, OIDC provider for IRSA
- **outputs.tf** — Exports cluster endpoint, security group IDs

**What it needs:** VPC ID + subnet IDs (from VPC module)

**What it provides:** Kubernetes cluster ready to use

**Used by:** All environments

---

### Module 3: RDS (Database)
**File:** `modules/rds/`
- **variables.tf** — Input: instance class, storage size, passwords
- **main.tf** — Creates 2 PostgreSQL databases (users_db, tickets_db), security group, subnet group
- **outputs.tf** — Exports database endpoints (so app can connect)

**What it needs:** VPC ID + data subnet IDs + security group

**What it provides:** Two managed PostgreSQL databases

**Used by:** All environments

---

### Module 4: ElastiCache (Redis Cache)
**File:** `modules/elasticache/`
- **variables.tf** — Input: node type (cache.t3.micro), etc.
- **main.tf** — Creates Redis cluster, security group, subnet group
- **outputs.tf** — Exports Redis endpoint

**What it needs:** VPC ID + data subnet IDs + security group

**What it provides:** Managed Redis cache for session/data caching

**Used by:** All environments

---

### Module 5: Secrets Manager
**File:** `modules/secrets/`
- **variables.tf** — Input: passwords, JWT secret, database URLs
- **main.tf** — Creates AWS Secrets Manager entries for DB creds, Redis URL, JWT secret
- **outputs.tf** — Exports secret names (for EKS pods to retrieve)

**What it needs:** Database endpoints + Redis endpoint (to construct connection strings)

**What it provides:** Secure secrets stored in AWS (not in code)

**Used by:** All environments

---

### Module 6: EC2 (Virtual Machines)
**File:** `modules/aws_ec2/`
- **variables.tf** — Input: instance type, AMI, tags
- **main.tf** — Creates EC2 instances
- **outputs.tf** — Exports instance IPs

**Status:** Available but NOT used in lab environment (using EKS instead)

---

## 3. ENVIRONMENTS — Deployment Targets

**Purpose:** Each environment is a separate Terraform root that calls modules

### Environment: LAB (Active)

**Directory:** `iac/environments/lab/`

**Files:**

#### versions.tf
**What:** Terraform version requirements + provider config
**Contains:**
- Terraform version >= 1.0
- AWS provider version ~> 5.0
- Kubernetes/Helm/TLS provider versions (needed because this environment deploys to EKS)
- **Provider default_tags block** — Automatically applies Owner + Email to ALL resources

```hcl
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Owner       = "quyet_nc"
      Email       = "quyetnc99@gmail.com"
      Environment = "lab"
      ManagedBy   = "Terraform"
    }
  }
}
```

---

#### backend.tf
**What:** Where to store Terraform state
**Points to:**
- S3 bucket: `proops2026-tfstate-quyetnc` (created by bootstrap)
- State file path: `lab/terraform.tfstate`
- Lock table: `proops2026-tfstate-lock-quyetnc` (prevents concurrent applies)

---

#### variables.tf
**What:** Input variables for the lab environment
**Examples:**
- `cluster_name` = "helpdesk-quyetnc-cluster"
- `aws_region` = "ap-northeast-1"
- `owner_name` = "quyet_nc"
- `owner_email` = "quyetnc99@gmail.com"
- `postgres_users_password` = (sensitive)
- `redis_node_type` = "cache.t3.micro"

**How to change:** Edit these values in variables.tf before `terraform plan`

---

#### main.tf
**What:** The actual configuration — calls all modules
**Structure:**

```hcl
locals {
  common_tags = {
    Owner       = var.owner_name
    Email       = var.owner_email
    Environment = "lab"
    Project     = "proops2026"
    ManagedBy   = "Terraform"
  }
}

module "vpc" { ... }           # Create VPC first
module "eks" { ... }           # Create K8s cluster (needs VPC)
module "rds" { ... }           # Create databases (needs VPC)
module "elasticache" { ... }   # Create Redis (needs VPC)
module "secrets" { ... }       # Create secrets (needs RDS + Redis endpoints)

resource "helm_release" "..." { ... }  # Deploy Helm charts to K8s
```

**Key insight:** Modules are called IN ORDER because later modules need outputs from earlier ones

**Dependencies:**
```
VPC → EKS (needs subnets)
VPC → RDS (needs data subnets)
VPC → ElastiCache (needs data subnets)
RDS + ElastiCache → Secrets (need endpoints to create connection strings)
Secrets → Helm releases (pods need to read secrets)
```

---

#### outputs.tf
**What:** Information to display after apply
**Examples:**
- EKS cluster endpoint
- RDS database endpoints
- Redis endpoint
- Security group IDs

**Used for:** Connecting apps to infrastructure

---

#### .terraform.lock.hcl
**What:** Version lock file (DO NOT EDIT)
**Purpose:** Ensures everyone on the team uses the same provider versions
**What to do:** Commit to git

---

### Environments: Dev, Test, Prod (Template Structure Ready)

Currently not created, but when you do:

**Dev:** Will have similar structure to lab, with:
- `cluster_name` = "helpdesk-quyetnc-dev"
- `Environment = "dev"` (in tags)

**Test:** Same pattern, `Environment = "test"`

**Prod:** Same pattern, `Environment = "prod"` + CI/CD only (no manual apply)

---

## 4. SPECIAL FOLDERS

### unrelated/ (Legacy Code)
**Status:** ⚠️ DO NOT MODIFY
**Why:** Contains old experiments, different patterns
**Leave as:** Reference/archive only

---

### variables.tf (Root Level)
**File:** `iac/variables.tf`
**Status:** Currently UNUSED (reference only)

**Why it exists but isn't used:**
- Terraform can't inherit variables from parent directories
- Each environment (bootstrap, lab, etc.) must define its own variables

**Best practice:** Either delete it OR keep as documentation showing the tag pattern

---

## How Everything Connects

```
┌─────────────────────────────────────────────────────────────────┐
│ User runs: cd iac/environments/lab && terraform plan            │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
    ┌────▼────────────┐         ┌────────▼─────┐
    │ versions.tf     │         │ main.tf       │
    │ - Providers     │         │ - Calls 5     │
    │ - default_tags  │         │   modules     │
    └────────────────┘         │ - Helm charts │
         │                     └────────┬────────┘
         │                             │
         │         ┌───────────────────┼───────────────────┐
         │         │                   │                   │
         │    ┌────▼────┐        ┌─────▼─────┐      ┌─────▼────┐
         │    │ VPC     │        │ EKS       │      │ RDS      │
         │    │ module  │        │ module    │      │ module   │
         │    └─────────┘        └───────────┘      └──────────┘
         │
         │    ┌──────────────────────────────────────────────────┐
         └────┤ backend.tf                                       │
              │ - Points to S3: lab/terraform.tfstate             │
              │ - Lock table (prevents conflicts)                │
              └──────────────────────────────────────────────────┘
                             ▲
                             │
                    ┌────────┴─────────┐
                    │ bootstrap/        │
                    │ - Created S3      │
                    │   bucket FIRST    │
                    └──────────────────┘
```

---

## Common Commands

### Deploy the lab environment:
```bash
cd iac/environments/lab

# 1. Initialize (download modules)
terraform init

# 2. See what will be created
terraform plan

# 3. Create everything
terraform apply
```

### Destroy the lab environment:
```bash
cd iac/environments/lab
terraform destroy
```

### Check current state:
```bash
terraform show
```

### Modify and redeploy:
```bash
# Edit variables.tf or main.tf
# Then:
terraform plan   # Review changes
terraform apply  # Apply changes
```

---

## File Dependency Tree

```
bootstrap/main.tf (state bucket)
    ↓
environments/lab/
    ├── versions.tf (providers + default_tags)
    ├── backend.tf (points to bootstrap's bucket)
    ├── variables.tf (input values)
    └── main.tf (orchestration)
        ├── calls modules/vpc/
        │   ├── modules/vpc/variables.tf
        │   ├── modules/vpc/main.tf (creates VPC + subnets)
        │   └── modules/vpc/outputs.tf (exports IDs)
        │
        ├── calls modules/eks/
        │   ├── modules/eks/variables.tf
        │   ├── modules/eks/main.tf (cluster + node group)
        │   ├── modules/eks/iam.tf (roles)
        │   └── modules/eks/outputs.tf (cluster endpoint)
        │
        ├── calls modules/rds/
        │   ├── modules/rds/variables.tf
        │   ├── modules/rds/main.tf (2 databases)
        │   └── modules/rds/outputs.tf (endpoints)
        │
        ├── calls modules/elasticache/
        │   ├── modules/elasticache/variables.tf
        │   ├── modules/elasticache/main.tf (Redis)
        │   └── modules/elasticache/outputs.tf (Redis endpoint)
        │
        ├── calls modules/secrets/
        │   ├── modules/secrets/variables.tf
        │   ├── modules/secrets/main.tf (secrets)
        │   └── modules/secrets/outputs.tf (secret names)
        │
        └── resource helm_release
            └── Deploy apps to K8s
```

---

## What Each File Type Does

| Type | Purpose | Example |
|------|---------|---------|
| **variables.tf** | Define inputs | `cluster_name`, `owner_name`, etc. |
| **main.tf** | Define resources & calls | Creates VPC, calls modules |
| **outputs.tf** | Export information | VPC ID, endpoint URLs |
| **versions.tf** | Provider config | AWS provider version, default_tags |
| **backend.tf** | State storage | S3 bucket path, DynamoDB lock |
| **iam.tf** | IAM roles/policies | Cluster role, node role, IRSA |
| **\*.lock.hcl** | Version locks | (auto-generated, commit to git) |

---

## Quick Reference — What's Actually Active?

✅ **Active (being used now):**
- ✅ `bootstrap/main.tf` — State bucket
- ✅ `modules/vpc/` — VPC component
- ✅ `modules/eks/` — EKS component
- ✅ `modules/rds/` — RDS component
- ✅ `modules/elasticache/` — Redis component
- ✅ `modules/secrets/` — Secrets component
- ✅ `environments/lab/` — Lab deployment

❌ **Not active:**
- ❌ `modules/aws_ec2/` — Available but not used (EKS instead)
- ❌ `environments/dev/`, `test/`, `prod/` — Template structure only
- ❌ `iac/variables.tf` — Unused reference file
- ❌ `unrelated/` — Legacy code (do not touch)

---

## Summary

You have a **modular, reusable IaC structure:**

1. **Bootstrap** = "Set up storage first" (1 file)
2. **Modules** = "Define what we're building" (6 reusable components)
3. **Environments** = "Deploy to different targets" (lab is active, others are templates)

Each environment calls the same modules but with different inputs (cluster names, instance sizes, etc.).

**The beautiful part:** You can create `dev/`, `test/`, `prod/` by copy-pasting lab/ structure and changing a few variable values. Same modules, different parameters.

Is anything still unclear? I can zoom into any specific file or flow.
