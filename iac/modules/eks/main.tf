resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  version  = var.cluster_version
  role_arn = aws_iam_role.cluster_role.arn

  access_config {
    authentication_mode = "API_AND_CONFIG_MAP"
  }

  vpc_config {
    subnet_ids = concat(var.public_subnet_ids, var.private_subnet_ids)
  }

  tags = merge(var.tags, { Name = var.cluster_name })

  depends_on = [aws_iam_role_policy_attachment.cluster_policy]
}

resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.cluster_name}-node-group"
  node_role_arn   = aws_iam_role.node_role.arn
  subnet_ids      = var.private_subnet_ids
  instance_types  = [var.node_instance_type]
  capacity_type   = var.node_capacity_type

  scaling_config {
    min_size     = var.node_min_size
    max_size     = var.node_max_size
    desired_size = var.node_desired_size
  }

  tags = merge(var.tags, {
    Name                                            = "${var.cluster_name}-node-group"
    "k8s.io/cluster-autoscaler/${var.cluster_name}" = "owned"
    "k8s.io/cluster-autoscaler/enabled"             = "true"
  })

  depends_on = [
    aws_iam_role_policy_attachment.node_policy,
    aws_iam_role_policy_attachment.cni_policy,
    aws_iam_role_policy_attachment.registry_policy,
  ]
}

resource "aws_eks_access_entry" "node_group" {
  cluster_name  = aws_eks_cluster.main.name
  principal_arn = aws_iam_role.node_role.arn
  type          = "EC2_LINUX"

  tags = var.tags
}

resource "aws_eks_access_entry" "user" {
  cluster_name  = aws_eks_cluster.main.name
  principal_arn = var.user_arn
  type          = "STANDARD"

  tags = merge(var.tags, { Name = "user-access" })
}

resource "aws_eks_access_policy_association" "user_admin" {
  cluster_name             = aws_eks_cluster.main.name
  policy_arn               = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
  principal_arn            = var.user_arn
  access_scope {
    type = "cluster"
  }
}
