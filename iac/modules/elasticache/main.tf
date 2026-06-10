resource "aws_security_group" "redis" {
  name        = "${var.cluster_name}-redis-sg"
  description = "Allow Redis from EKS nodes only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Redis from EKS cluster nodes"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [var.cluster_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.cluster_name}-redis-sg" })
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.cluster_name}-redis-subnet-group"
  subnet_ids = var.data_subnet_ids
  tags       = merge(var.tags, { Name = "${var.cluster_name}-redis-subnet-group" })
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.cluster_name}-redis"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  tags = merge(var.tags, { Name = "${var.cluster_name}-redis" })
}
