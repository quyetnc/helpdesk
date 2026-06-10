output "api_server_name" {
  description = "Name of the API server instance"
  value       = module.api_server.name
}

output "api_server_public_ip" {
  description = "Public IP of the API server"
  value       = module.api_server.public_ip
}

output "api_server_id" {
  description = "Instance ID of the API server"
  value       = module.api_server.id
}