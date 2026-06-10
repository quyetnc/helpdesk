variable "cluster_name"       { type = string }
variable "cluster_version"    { type = string }
variable "aws_region"         { type = string }
variable "owner_name"         { type = string }
variable "owner_email"        { type = string }
variable "node_instance_type" { type = string }
variable "node_capacity_type" { type = string }
variable "node_min_size"      { type = number }
variable "node_max_size"      { type = number }
variable "node_desired_size"  { type = number }
variable "vpc_id"             { type = string }
variable "public_subnet_ids"  { type = list(string) }
variable "private_subnet_ids" { type = list(string) }

variable "user_arn" {
  description = "IAM ARN of the user who will administer the cluster"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
