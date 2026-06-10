terraform {
  required_version = "~> 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment for production to use S3 remote state
  # backend "s3" {
  #   bucket         = "proops-blogcms-terraform-state"
  #   key            = "dev/terraform.tfstate"
  #   region         = "ap-southeast-2"
  #   encrypt        = true
  #   dynamodb_table = "terraform-locks"
  # }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      ManagedBy = "Terraform"
    }
  }
}