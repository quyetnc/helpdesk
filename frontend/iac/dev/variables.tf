variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "service_name" {
  description = "Service name"
  type        = string
  default     = "frontend"
}

variable "owner_name" {
  description = "Resource owner name"
  type        = string
}

variable "owner_email" {
  description = "Resource owner email"
  type        = string
}
