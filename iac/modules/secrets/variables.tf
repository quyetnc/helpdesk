variable "cluster_name" {
  type = string
}

variable "owner_name" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "postgres_users_password" {
  type      = string
  sensitive = true
}

variable "postgres_tickets_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "rds_users_address" {
  type = string
}

variable "rds_tickets_address" {
  type = string
}

variable "redis_address" {
  type = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
