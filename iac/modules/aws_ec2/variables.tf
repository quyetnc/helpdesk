variable "prefix" {
  description = "Organization prefix (e.g., 'proops')"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9]*$", var.prefix))
    error_message = "Prefix must start with lowercase letter, contain only lowercase letters and numbers."
  }
}

variable "project" {
  description = "Project shortcode (e.g., 'blogcms')"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9]*$", var.project))
    error_message = "Project must start with lowercase letter, contain only lowercase letters and numbers."
  }
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "Environment must be 'dev', 'test', or 'prod'."
  }
}

variable "region_code" {
  description = "Compact region code (e.g., 'apse2' for ap-southeast-2)"
  type        = string
}

variable "region" {
  description = "AWS region in full format (e.g., 'ap-southeast-2')"
  type        = string
}

variable "tags" {
  description = "Common tags map (Project, Environment, ResponsibleParty, Owner, Email)"
  type        = map(string)
  validation {
    condition     = contains(keys(var.tags), "Project") && contains(keys(var.tags), "Environment") && contains(keys(var.tags), "ResponsibleParty") && contains(keys(var.tags), "Owner") && contains(keys(var.tags), "Email")
    error_message = "Tags must include: Project, Environment, ResponsibleParty, Owner, Email."
  }
}

variable "purpose" {
  description = "Purpose of the EC2 instance (e.g., 'api-server')"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type (e.g., 't3.micro')"
  type        = string
}

variable "vpc_security_group_ids" {
  description = "List of security group IDs to attach"
  type        = list(string)
}

variable "subnet_id" {
  description = "Subnet ID to launch the instance in"
  type        = string
}