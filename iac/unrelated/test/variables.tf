variable "prefix" {
  description = "Organization prefix"
  type        = string
}

variable "project" {
  description = "Project shortcode"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "Environment must be 'dev', 'test', or 'prod'."
  }
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "region_code" {
  description = "Compact region code"
  type        = string
}

variable "responsible_party" {
  description = "Email of responsible party for this environment"
  type        = string
}

variable "owner" {
  description = "Email of resource owner"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "purpose" {
  description = "Purpose of the EC2 instance"
  type        = string
  default     = "api-server"
}