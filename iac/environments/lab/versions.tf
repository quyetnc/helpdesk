terraform {
  required_version = ">= 1.0"

  required_providers {
    aws        = { source = "hashicorp/aws",        version = "~> 5.0" }
    kubernetes = { source = "hashicorp/kubernetes",  version = "~> 2.23" }
    helm       = { source = "hashicorp/helm",        version = "~> 2.11" }
    tls        = { source = "hashicorp/tls",         version = "~> 4.0" }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Owner       = var.owner_name
      Email       = var.owner_email
      Environment = "lab"
      ManagedBy   = "Terraform"
    }
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# NOTE: kubernetes and helm providers need the EKS cluster to already exist.
#
# First apply (cluster creation):
#   terraform apply -target=module.vpc -target=module.eks
#
# Second apply (everything else):
#   terraform apply
# ─────────────────────────────────────────────────────────────────────────────
data "aws_eks_cluster" "main" {
  name       = var.cluster_name
  depends_on = [module.eks]
}

data "aws_eks_cluster_auth" "main" {
  name       = var.cluster_name
  depends_on = [module.eks]
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.main.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.main.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.main.token
}

provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.main.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.main.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.main.token
  }
}
