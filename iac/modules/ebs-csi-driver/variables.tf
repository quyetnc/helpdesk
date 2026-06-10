variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "oidc_provider_arn" {
  description = "ARN of the OIDC provider for IRSA"
  type        = string
}

variable "oidc_issuer" {
  description = "OIDC issuer URL (without https://)"
  type        = string
}

variable "helm_chart_version" {
  description = "EBS CSI Driver Helm chart version"
  type        = string
  default     = "2.26.0"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "cluster_depends_on" {
  description = "Dependency on EKS cluster"
  type        = any
  default     = null
}
