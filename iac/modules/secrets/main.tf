resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${var.cluster_name}/db-credentials"
  description = "Database connection URLs for all services"
  tags        = merge(var.tags, { Name = "${var.cluster_name}-db-credentials" })
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    DATABASE_URL_USERS   = "postgresql://users_user:${var.postgres_users_password}@${var.rds_users_address}:5432/users_db"
    DATABASE_URL_TICKETS = "postgresql://tickets_user:${var.postgres_tickets_password}@${var.rds_tickets_address}:5432/tickets_db"
  })
}

resource "aws_secretsmanager_secret" "redis_credentials" {
  name        = "${var.cluster_name}/redis-credentials"
  description = "Redis connection URL"
  tags        = merge(var.tags, { Name = "${var.cluster_name}-redis-credentials" })
}

resource "aws_secretsmanager_secret_version" "redis_credentials" {
  secret_id     = aws_secretsmanager_secret.redis_credentials.id
  secret_string = jsonencode({ REDIS_URL = "redis://${var.redis_address}:6379" })
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "${var.cluster_name}/jwt-secret"
  description = "JWT signing secret"
  tags        = merge(var.tags, { Name = "${var.cluster_name}-jwt-secret" })
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({ JWT_SECRET = var.jwt_secret })
}
