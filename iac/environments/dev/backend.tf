terraform {
  backend "s3" {
    bucket         = "proops2026-tfstate-quyetnc"
    key            = "dev/terraform.tfstate"
    region         = "ap-northeast-1"
    encrypt        = true
    dynamodb_table = "proops2026-tfstate-lock-quyetnc"
  }
}
