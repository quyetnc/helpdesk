locals {
  common_tags = {
    Owner       = var.owner_name
    Email       = var.owner_email
    Environment = var.environment
    Project     = "proops2026"
    ManagedBy   = "Terraform"
  }
}

module "vpc" {
  source       = "../../modules/vpc"
  cluster_name = var.cluster_name
  aws_region   = var.aws_region
  owner_name   = var.owner_name
  tags         = local.common_tags
}

module "eks" {
  source = "../../modules/eks"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version
  aws_region      = var.aws_region
  owner_name      = var.owner_name
  owner_email     = var.owner_email
  tags            = local.common_tags

  node_instance_type = var.node_instance_type
  node_capacity_type = var.node_capacity_type
  node_min_size      = var.node_min_size
  node_max_size      = var.node_max_size
  node_desired_size  = var.node_desired_size

  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids

  user_arn = var.user_arn
}

# ── ECR Repositories for Docker images ────────────────────────────────────
module "ecr" {
  source = "../../modules/ecr"

  cluster_name = var.cluster_name
  tags         = local.common_tags
}

# ── EBS StorageClass for Persistent Volumes ────────────────────────────────
module "ebs_storage" {
  source = "../../modules/ebs-storage"

  enable_dev_storageclass = false

  depends_on = [module.eks]
}

# TODO: Uncomment when IAM permissions granted for RDS, ElastiCache, Secrets Manager
# module "rds" {
#   source = "../../modules/rds"
#
#   cluster_name              = var.cluster_name
#   owner_name                = var.owner_name
#   tags                      = local.common_tags
#   vpc_id                    = module.vpc.vpc_id
#   data_subnet_ids           = module.vpc.data_subnet_ids
#   cluster_security_group_id = module.eks.cluster_security_group_id
#   rds_instance_class        = var.rds_instance_class
#   rds_allocated_storage     = var.rds_allocated_storage
#   postgres_users_password   = var.postgres_users_password
#   postgres_tickets_password = var.postgres_tickets_password
# }
#
# module "elasticache" {
#   source = "../../modules/elasticache"
#
#   cluster_name              = var.cluster_name
#   owner_name                = var.owner_name
#   tags                      = local.common_tags
#   vpc_id                    = module.vpc.vpc_id
#   data_subnet_ids           = module.vpc.data_subnet_ids
#   cluster_security_group_id = module.eks.cluster_security_group_id
#   redis_node_type           = var.redis_node_type
# }
#
# module "secrets" {
#   source = "../../modules/secrets"
#
#   cluster_name              = var.cluster_name
#   owner_name                = var.owner_name
#   tags                      = local.common_tags
#   aws_region                = var.aws_region
#   postgres_users_password   = var.postgres_users_password
#   postgres_tickets_password = var.postgres_tickets_password
#   jwt_secret                = var.jwt_secret
#   rds_users_address         = module.rds.users_address
#   rds_tickets_address       = module.rds.tickets_address
#   redis_address             = module.elasticache.redis_address
# }

# ── Helm Setup ────────────────────────────────────────────────────────────────
# These are in the environment (not a module) because Helm needs
# the kubernetes/helm providers, which are configured here in the root.

# Using local-exec for repo setup (proven approach for stable deployments)
resource "null_resource" "helm_repo_setup" {
  provisioner "local-exec" {
    command = "helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx --force-update && helm repo add autoscaler https://kubernetes.github.io/autoscaler --force-update && helm repo update"
  }

  depends_on = [module.eks]
}

# ── Helm Releases ──────────────────────────────────────────────────────────────

resource "helm_release" "nginx_ingress" {
  name             = "nginx-ingress"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  namespace        = "ingress-nginx"
  version          = "4.10.0"
  create_namespace = true

  values = [yamlencode({
    controller = {
      service = {
        type = "LoadBalancer"
      }
    }
  })]

  depends_on = [module.eks, null_resource.helm_repo_setup]
}

resource "helm_release" "cluster_autoscaler" {
  name       = "cluster-autoscaler"
  repository = "https://kubernetes.github.io/autoscaler"
  chart      = "cluster-autoscaler"
  namespace  = "kube-system"
  version    = "9.37.0"

  values = [yamlencode({
    autoDiscovery = {
      clusterName = var.cluster_name
    }
    awsRegion = var.aws_region
    rbac = {
      serviceAccount = {
        create = true
        name   = "cluster-autoscaler"
        annotations = {
          "eks.amazonaws.com/role-arn" = module.eks.cluster_autoscaler_role_arn
        }
      }
    }
  })]

  depends_on = [module.eks, null_resource.helm_repo_setup]
}

# TODO: Uncomment when Secrets Manager module is uncommented
# resource "helm_release" "external_secrets" {
#   name             = "external-secrets"
#   repository       = "https://charts.external-secrets.io"
#   chart            = "external-secrets"
#   namespace        = "external-secrets"
#   version          = "0.9.20"
#   create_namespace = true
#
#   values = [yamlencode({
#     serviceAccount = { annotations = {
#       "eks.amazonaws.com/role-arn" = module.eks.external_secrets_role_arn
#     } }
#   })]
#
#   depends_on = [module.eks]
# }
