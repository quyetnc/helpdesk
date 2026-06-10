locals {
  common_tags = {
    Owner       = var.owner_name
    Email       = var.owner_email
    Environment = var.environment
    Project     = "proops2026"
    Service     = var.service_name
    ManagedBy   = "Terraform"
  }
}

# VPC reference (will use default VPC for dev practice)
data "aws_vpc" "default" {
  default = true
}

# Security group for frontend service
resource "aws_security_group" "frontend" {
  name        = "${var.service_name}-${var.environment}-sg"
  description = "Security group for ${var.service_name} service"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from internet"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.service_name}-${var.environment}-sg"
    }
  )
}
