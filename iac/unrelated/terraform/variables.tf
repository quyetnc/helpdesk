variable "aws_region" {
  description = "AWS region to deploy in"
  type        = string
  default     = "ap-northeast-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "owner_name" {
  description = "Your name (for tagging)"
  type        = string
  default     = "quyet_nc"
}
