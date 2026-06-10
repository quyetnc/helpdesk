# Jenkins EC2 Instance for CI/CD Pipeline

# Get latest Ubuntu 22.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security Group for Jenkins
resource "aws_security_group" "jenkins" {
  name        = "${var.environment}-jenkins-sg"
  description = "Security group for Jenkins CI/CD"
  vpc_id      = var.vpc_id

  tags = {
    Name  = "${var.environment}-jenkins-sg"
    Owner = var.owner
    Email = var.owner_email
  }
}

# Allow SSH from anywhere (restrict in production)
resource "aws_security_group_rule" "jenkins_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"] # Restrict in production
  security_group_id = aws_security_group.jenkins.id
}

# Allow Jenkins web UI (port 8080)
resource "aws_security_group_rule" "jenkins_web" {
  type              = "ingress"
  from_port         = 8080
  to_port           = 8080
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"] # Can restrict to office IP
  security_group_id = aws_security_group.jenkins.id
}

# Allow all outbound traffic (to reach EKS, ECR, etc.)
resource "aws_security_group_rule" "jenkins_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.jenkins.id
}

# IAM Role for Jenkins EC2
resource "aws_iam_role" "jenkins" {
  name = "${var.environment}-jenkins-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name  = "${var.environment}-jenkins-role"
    Owner = var.owner
    Email = var.owner_email
  }
}

# Allow Jenkins to push images to ECR
resource "aws_iam_role_policy" "jenkins_ecr" {
  name = "${var.environment}-jenkins-ecr-policy"
  role = aws_iam_role.jenkins.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      }
    ]
  })
}

# Allow Jenkins to access EKS cluster
resource "aws_iam_role_policy" "jenkins_eks" {
  name = "${var.environment}-jenkins-eks-policy"
  role = aws_iam_role.jenkins.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:ListClusters"
        ]
        Resource = "*"
      }
    ]
  })
}

# Allow Jenkins to manage IAM for kubeconfig
resource "aws_iam_role_policy" "jenkins_iam" {
  name = "${var.environment}-jenkins-iam-policy"
  role = aws_iam_role.jenkins.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:ListRolePolicies"
        ]
        Resource = "*"
      }
    ]
  })
}

# Instance Profile for Jenkins
resource "aws_iam_instance_profile" "jenkins" {
  name = "${var.environment}-jenkins-profile"
  role = aws_iam_role.jenkins.name
}

# EC2 Instance for Jenkins
resource "aws_instance" "jenkins" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [aws_security_group.jenkins.id]
  iam_instance_profile   = aws_iam_instance_profile.jenkins.name
  key_name               = var.key_name

  # Root volume
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 50 # 50 GB for Jenkins data
    delete_on_termination = true
  }

  # User data script to install Jenkins
  user_data = file("${path.module}/user_data.sh")

  tags = {
    Name  = "${var.environment}-jenkins"
    Owner = var.owner
    Email = var.owner_email
  }

  depends_on = [aws_iam_instance_profile.jenkins]
}

# Elastic IP for Jenkins (static IP)
resource "aws_eip" "jenkins" {
  instance = aws_instance.jenkins.id
  domain   = "vpc"

  tags = {
    Name  = "${var.environment}-jenkins-eip"
    Owner = var.owner
    Email = var.owner_email
  }

  depends_on = [aws_instance.jenkins]
}
