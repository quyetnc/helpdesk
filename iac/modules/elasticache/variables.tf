variable "cluster_name"               { type = string }
variable "owner_name"                { type = string }
variable "vpc_id"                    { type = string }
variable "data_subnet_ids"           { type = list(string) }
variable "cluster_security_group_id" { type = string }
variable "redis_node_type"           { type = string }

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
