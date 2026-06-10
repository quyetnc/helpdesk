resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name                                         = "${var.cluster_name}-vpc"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  })
}

# ── Public subnets — Load Balancers and NAT Gateway ───────────────────────────
resource "aws_subnet" "public_1a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name                                         = "${var.cluster_name}-public-1a"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                    = "1"
  })
}

resource "aws_subnet" "public_1c" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}c"
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name                                         = "${var.cluster_name}-public-1c"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                    = "1"
  })
}

# ── Private subnets — EKS nodes ───────────────────────────────────────────────
resource "aws_subnet" "private_1a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.11.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = false

  tags = merge(var.tags, {
    Name                                         = "${var.cluster_name}-private-1a"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"           = "1"
  })
}

resource "aws_subnet" "private_1c" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.12.0/24"
  availability_zone       = "${var.aws_region}c"
  map_public_ip_on_launch = false

  tags = merge(var.tags, {
    Name                                         = "${var.cluster_name}-private-1c"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"           = "1"
  })
}

# ── Data subnets — RDS + ElastiCache (no internet route) ─────────────────────
resource "aws_subnet" "data_1a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.21.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = false

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-data-1a"
    Tier = "data"
  })
}

resource "aws_subnet" "data_1c" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.22.0/24"
  availability_zone       = "${var.aws_region}c"
  map_public_ip_on_launch = false

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-data-1c"
    Tier = "data"
  })
}

# ── Internet Gateway ──────────────────────────────────────────────────────────
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(var.tags, { Name = "${var.cluster_name}-igw" })
}

# ── NAT Gateway ───────────────────────────────────────────────────────────────
resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = merge(var.tags, { Name = "${var.cluster_name}-nat-eip" })
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_1a.id
  tags          = merge(var.tags, { Name = "${var.cluster_name}-nat" })
  depends_on    = [aws_internet_gateway.main]
}

# ── Route tables ──────────────────────────────────────────────────────────────
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, { Name = "${var.cluster_name}-rt-public" })
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = merge(var.tags, { Name = "${var.cluster_name}-rt-private" })
}

resource "aws_route_table" "data" {
  vpc_id = aws_vpc.main.id
  tags   = merge(var.tags, { Name = "${var.cluster_name}-rt-data" })
}

resource "aws_route_table_association" "public_1a" {
  subnet_id      = aws_subnet.public_1a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_1c" {
  subnet_id      = aws_subnet.public_1c.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_1a" {
  subnet_id      = aws_subnet.private_1a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_1c" {
  subnet_id      = aws_subnet.private_1c.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "data_1a" {
  subnet_id      = aws_subnet.data_1a.id
  route_table_id = aws_route_table.data.id
}

resource "aws_route_table_association" "data_1c" {
  subnet_id      = aws_subnet.data_1c.id
  route_table_id = aws_route_table.data.id
}
