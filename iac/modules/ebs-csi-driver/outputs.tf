output "role_arn" {
  description = "ARN of the EBS CSI Driver IAM role"
  value       = aws_iam_role.ebs_csi_driver.arn
}

output "helm_release_name" {
  description = "Name of the Helm release"
  value       = helm_release.ebs_csi_driver.name
}
