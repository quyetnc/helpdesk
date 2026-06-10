variable "cluster_name" { type = string }
variable "aws_region"   { type = string }
variable "owner_name"   { type = string }

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
