output "security_group_id" {
  description = "Frontend security group ID"
  value       = aws_security_group.frontend.id
}

output "security_group_name" {
  description = "Frontend security group name"
  value       = aws_security_group.frontend.name
}

output "vpc_id" {
  description = "VPC ID"
  value       = data.aws_vpc.default.id
}
