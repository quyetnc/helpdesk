locals {
  tags = {
    Project           = var.project
    Environment       = var.environment
    ResponsibleParty  = var.responsible_party
    Owner             = var.owner
  }
}

module "api_server" {
  source = "../modules/aws_ec2"

  prefix                 = var.prefix
  project                = var.project
  environment            = var.environment
  region_code            = var.region_code
  region                 = var.region
  purpose                = var.purpose
  instance_type          = var.instance_type
  vpc_security_group_ids = [data.aws_security_group.default.id]
  subnet_id              = data.aws_subnet.default.id

  tags = local.tags
}

data "aws_vpc" "default" {
  default = true
}

data "aws_security_group" "default" {
  vpc_id = data.aws_vpc.default.id
  name   = "default"
}

data "aws_subnet" "default" {
  vpc_id            = data.aws_vpc.default.id
  availability_zone = "${var.region}a"
}