# EBS CSI Driver for dynamic EBS volume provisioning in EKS
# Enables StatefulSets to request EBS volumes via PersistentVolumeClaims

# Create IAM role for EBS CSI Driver (IRSA)
resource "aws_iam_role" "ebs_csi_driver" {
  name = "${var.cluster_name}-ebs-csi-driver"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${var.oidc_issuer}:sub" = "system:serviceaccount:kube-system:ebs-csi-controller-sa"
          "${var.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-ebs-csi-driver-role"
  })
}

# Attach EBS CSI Driver policy
resource "aws_iam_role_policy_attachment" "ebs_csi_driver" {
  role       = aws_iam_role.ebs_csi_driver.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
}

# Install EBS CSI Driver via Helm
resource "helm_release" "ebs_csi_driver" {
  name       = "aws-ebs-csi-driver"
  repository = "https://kubernetes-sigs.github.io/aws-ebs-csi-driver"
  chart      = "aws-ebs-csi-driver"
  namespace  = "kube-system"
  version    = var.helm_chart_version

  values = [
    yamlencode({
      controller = {
        serviceAccount = {
          create = true
          name   = "ebs-csi-controller-sa"
          annotations = {
            "eks.amazonaws.com/role-arn" = aws_iam_role.ebs_csi_driver.arn
          }
        }
        resources = {
          requests = {
            cpu    = "100m"
            memory = "256Mi"
          }
          limits = {
            cpu    = "200m"
            memory = "512Mi"
          }
        }
      }

      node = {
        serviceAccount = {
          create = true
          annotations = {
            "eks.amazonaws.com/role-arn" = aws_iam_role.ebs_csi_driver.arn
          }
        }
        resources = {
          requests = {
            cpu    = "100m"
            memory = "256Mi"
          }
          limits = {
            cpu    = "200m"
            memory = "512Mi"
          }
        }
      }

      tags = merge(var.tags, {
        "ebs.csi.aws.com/cluster" = var.cluster_name
      })
    })
  ]

  depends_on = [var.cluster_depends_on]
}
