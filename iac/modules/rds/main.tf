resource "aws_security_group" "rds" {
  name        = "${var.cluster_name}-rds-sg"
  description = "Allow PostgreSQL from EKS nodes only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from EKS cluster nodes"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.cluster_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.cluster_name}-rds-sg" })
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.cluster_name}-db-subnet-group"
  subnet_ids = var.data_subnet_ids
  tags       = merge(var.tags, { Name = "${var.cluster_name}-db-subnet-group" })
}

resource "aws_db_instance" "users" {
  identifier        = "${var.cluster_name}-users"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = var.rds_instance_class
  allocated_storage = var.rds_allocated_storage

  db_name  = "users_db"
  username = "users_user"
  password = var.postgres_users_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  deletion_protection    = false
  backup_retention_period = 7

  tags = merge(var.tags, { Name = "${var.cluster_name}-users-db" })
}

resource "aws_db_instance" "tickets" {
  identifier        = "${var.cluster_name}-tickets"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = var.rds_instance_class
  allocated_storage = var.rds_allocated_storage

  db_name  = "tickets_db"
  username = "tickets_user"
  password = var.postgres_tickets_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  deletion_protection    = false
  backup_retention_period = 7

  tags = merge(var.tags, { Name = "${var.cluster_name}-tickets-db" })
}
