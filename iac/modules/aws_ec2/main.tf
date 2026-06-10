data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

locals {
  name = "${var.prefix}-${var.project}-${var.environment}-ec2-${var.region_code}-${var.purpose}"
}

module "ec2" {
  source  = "terraform-aws-modules/ec2-instance/aws"
  version = "~> 5.6"

  name                   = local.name
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = var.vpc_security_group_ids

  associate_public_ip_address = true

  tags = merge(
    var.tags,
    {
      Name            = local.name
      ApplicationRole = var.purpose
      SensitiveData   = "false"
    }
  )
}
