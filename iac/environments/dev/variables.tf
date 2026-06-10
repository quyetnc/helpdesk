# ── Cluster ───────────────────────────────────────────────────────────────────
variable "cluster_name" {
  type    = string
  default = "helpdesk-quyetnc-cluster"
}

variable "cluster_version" {
  type    = string
  default = "1.30"
}

variable "aws_region" {
  type    = string
  default = "ap-northeast-1"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "owner_name" {
  type    = string
  default = "quyet_nc"
}

variable "owner_email" {
  type    = string
  default = "quyetnc99@gmail.com"
}

# ── Nodes ─────────────────────────────────────────────────────────────────────
variable "node_instance_type" {
  type    = string
  default = "t3.medium"
}

variable "node_capacity_type" {
  type    = string
  default = "SPOT"
}

variable "node_min_size" {
  type    = number
  default = 1
}

variable "node_max_size" {
  type    = number
  default = 2
}

variable "node_desired_size" {
  type    = number
  default = 1
}

# ── RDS ───────────────────────────────────────────────────────────────────────
variable "rds_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "rds_allocated_storage" {
  type    = number
  default = 8
}

variable "postgres_users_password" {
  type      = string
  sensitive = true
}

variable "postgres_tickets_password" {
  type      = string
  sensitive = true
}

# ── ElastiCache ───────────────────────────────────────────────────────────────
variable "redis_node_type" {
  type    = string
  default = "cache.t3.micro"
}

# ── Secrets ───────────────────────────────────────────────────────────────────
variable "jwt_secret" {
  type      = string
  sensitive = true
}

# ── IAM ───────────────────────────────────────────────────────────────────
variable "user_arn" {
  description = "IAM ARN of the user who will administer the cluster"
  type        = string
  default     = "arn:aws:iam::905418181527:user/quyet_nc"
}

# ── Jenkins EC2 ───────────────────────────────────────────────────────────────
variable "jenkins_instance_type" {
  description = "EC2 instance type for Jenkins"
  type        = string
  default     = "t3.medium"
}

variable "jenkins_key_name" {
  description = "EC2 Key Pair name for Jenkins SSH access"
  type        = string
  # User must provide this in terraform.tfvars or -var flag
}
