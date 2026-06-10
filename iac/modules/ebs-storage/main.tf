# EBS-backed StorageClass for Kubernetes persistent volumes

resource "kubernetes_storage_class" "ebs_gp3" {
  metadata {
    name = "ebs-gp3"
    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }

  storage_provisioner = "ebs.csi.aws.com"
  reclaim_policy      = "Delete"
  allow_volume_expansion = true

  parameters = {
    type       = "gp3"
    iops       = "3000"
    throughput = "125"
    encrypted  = "true"
  }

  volume_binding_mode = "WaitForFirstConsumer"
}

# For dev: smaller, cheaper GP3 volumes
resource "kubernetes_storage_class" "ebs_gp3_dev" {
  metadata {
    name = "ebs-gp3-dev"
    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
      "environment"                   = "dev"
    }
  }

  storage_provisioner = "ebs.csi.aws.com"
  reclaim_policy      = "Delete"
  allow_volume_expansion = true

  parameters = {
    type       = "gp3"
    iops       = "3000"
    throughput = "125"
    encrypted  = "true"
  }

  volume_binding_mode = "WaitForFirstConsumer"
}
