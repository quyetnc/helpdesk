output "instance" {
  description = "The EC2 instance object"
  value       = module.ec2
}

output "id" {
  description = "The EC2 instance ID"
  value       = module.ec2.id
}

output "public_ip" {
  description = "The public IP address of the instance"
  value       = module.ec2.public_ip
}

output "private_ip" {
  description = "The private IP address of the instance"
  value       = module.ec2.private_ip
}

output "name" {
  description = "The name of the instance"
  value       = local.name
}