# aws_ec2 Module

Facade module that wraps `terraform-aws-modules/ec2-instance/aws` and applies organization naming conventions and tagging standards.

## Usage

```hcl
module "api_server" {
  source = "../modules/aws_ec2"

  prefix                  = "proops"
  project                 = "blogcms"
  environment             = "dev"
  region_code             = "apse2"
  region                  = "ap-southeast-2"
  purpose                 = "api-server"
  instance_type           = "t3.micro"
  vpc_security_group_ids  = [aws_security_group.api.id]
  subnet_id               = aws_subnet.private.id

  tags = {
    Project            = "blogcms"
    Environment        = "dev"
    ResponsibleParty   = "trainer@example.com"
    Owner              = "ops-team@example.com"
  }
}
```

## Inputs

| Name | Description | Type | Required |
|------|-------------|------|----------|
| `prefix` | Organization prefix (e.g., 'proops') | string | Yes |
| `project` | Project shortcode (e.g., 'blogcms') | string | Yes |
| `environment` | Deployment environment ('dev', 'test', 'prod') | string | Yes |
| `region_code` | Compact region code (e.g., 'apse2') | string | Yes |
| `region` | AWS region in full format (e.g., 'ap-southeast-2') | string | Yes |
| `purpose` | Purpose of the EC2 instance (e.g., 'api-server') | string | Yes |
| `instance_type` | EC2 instance type (e.g., 't3.micro') | string | Yes |
| `vpc_security_group_ids` | List of security group IDs | list(string) | Yes |
| `subnet_id` | Subnet ID to launch the instance in | string | Yes |
| `tags` | Common tags (Project, Environment, ResponsibleParty, Owner) | map(string) | Yes |

## Outputs

| Name | Description |
|------|-------------|
| `instance` | The EC2 instance object |
| `id` | The EC2 instance ID |
| `public_ip` | The public IP address |
| `private_ip` | The private IP address |
| `name` | The instance name following convention |

## Naming Convention

Resources follow the pattern: `{prefix}-{project}-{environment}-ec2-{region_code}-{purpose}`

Example: `proops-blogcms-dev-ec2-apse2-api-server`

## Tagging

Two-layer tagging applied:
- **Layer 1 (Environment):** Project, Environment, ResponsibleParty, Owner (from var.tags)
- **Layer 2 (Resource-specific):** Name, ApplicationRole, SensitiveData