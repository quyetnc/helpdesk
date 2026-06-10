# ECR Repositories for Docker images

resource "aws_ecr_repository" "api_gateway" {
  name             = "api-gateway"
  force_delete     = true
  tags             = merge(var.tags, { Name = "api-gateway-repo" })
}

resource "aws_ecr_repository" "user_service" {
  name             = "user-service"
  force_delete     = true
  tags             = merge(var.tags, { Name = "user-service-repo" })
}

resource "aws_ecr_repository" "ticket_service" {
  name             = "ticket-service"
  force_delete     = true
  tags             = merge(var.tags, { Name = "ticket-service-repo" })
}

resource "aws_ecr_repository" "notification_service" {
  name             = "notification-service"
  force_delete     = true
  tags             = merge(var.tags, { Name = "notification-service-repo" })
}

resource "aws_ecr_repository" "frontend" {
  name             = "frontend"
  force_delete     = true
  tags             = merge(var.tags, { Name = "frontend-repo" })
}
