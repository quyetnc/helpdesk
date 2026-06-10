output "kubeconfig_command" {
  value       = "aws eks update-kubeconfig --name ${var.cluster_name} --region ${var.aws_region}"
  description = "Run this after apply to connect kubectl"
}

# TODO: Uncomment when RDS, ElastiCache, Secrets modules are uncommented
# output "rds_users_endpoint"   { value = module.rds.users_address }
# output "rds_tickets_endpoint" { value = module.rds.tickets_address }
# output "redis_endpoint"       { value = module.elasticache.redis_address }
#
# output "secrets_manager_paths" {
#   value = {
#     db_credentials    = module.secrets.db_credentials_secret_name
#     redis_credentials = module.secrets.redis_credentials_secret_name
#     jwt_secret        = module.secrets.jwt_secret_name
#   }
# }

output "external_secrets_role_arn"    { value = module.eks.external_secrets_role_arn }
output "cluster_autoscaler_role_arn"  { value = module.eks.cluster_autoscaler_role_arn }
