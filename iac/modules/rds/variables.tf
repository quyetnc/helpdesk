variable "cluster_name" {
  type = string
}

variable "owner_name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "data_subnet_ids" {
  type = list(string)
}

variable "cluster_security_group_id" {
  type = string
}

variable "rds_instance_class" {
  type = string
}

variable "rds_allocated_storage" {
  type = number
}

variable "postgres_users_password" {
  type      = string
  sensitive = true
}

variable "postgres_tickets_password" {
  type      = string
  sensitive = true
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
