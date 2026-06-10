terraform {
  backend "s3" {
    bucket         = "proops2026-tfstate-quyetnc"
    key            = "frontend/dev/terraform.tfstate"
    region         = "ap-southeast-2"
    dynamodb_table = "proops2026-tfstate-lock-quyetnc"
    encrypt        = true
  }
}
