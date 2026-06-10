output "db_credentials_secret_name" {
  value = aws_secretsmanager_secret.db_credentials.name
}

output "redis_credentials_secret_name" {
  value = aws_secretsmanager_secret.redis_credentials.name
}

output "jwt_secret_name" {
  value = aws_secretsmanager_secret.jwt_secret.name
}
