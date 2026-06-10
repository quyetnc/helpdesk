variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where Jenkins will be deployed"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID for Jenkins EC2 instance"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "EC2 Key Pair name for SSH access"
  type        = string
}

variable "owner" {
  description = "Owner name for tagging"
  type        = string
  default     = "DevOps Team"
}

variable "owner_email" {
  description = "Owner email for tagging"
  type        = string
}
