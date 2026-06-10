terraform {
  backend "s3" {
    bucket         = "proops2026-tfstate-quyetnc"
    key            = "environments/lab/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "proops2026-tfstate-lock-quyetnc"
    encrypt        = true
  }
}
