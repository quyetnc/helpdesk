output "repository_urls" {
  description = "ECR repository URLs"
  value = {
    api-gateway          = aws_ecr_repository.api_gateway.repository_url
    user-service         = aws_ecr_repository.user_service.repository_url
    ticket-service       = aws_ecr_repository.ticket_service.repository_url
    notification-service = aws_ecr_repository.notification_service.repository_url
    frontend             = aws_ecr_repository.frontend.repository_url
  }
}
