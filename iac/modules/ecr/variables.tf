variable "cluster_name" {
  description = "EKS cluster name (for tagging)"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
