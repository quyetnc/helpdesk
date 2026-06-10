output "jenkins_instance_id" {
  description = "Jenkins EC2 instance ID"
  value       = aws_instance.jenkins.id
}

output "jenkins_public_ip" {
  description = "Jenkins public IP address"
  value       = aws_eip.jenkins.public_ip
}

output "jenkins_private_ip" {
  description = "Jenkins private IP address"
  value       = aws_instance.jenkins.private_ip
}

output "jenkins_security_group_id" {
  description = "Jenkins security group ID"
  value       = aws_security_group.jenkins.id
}

output "jenkins_url" {
  description = "Jenkins web UI URL"
  value       = "http://${aws_eip.jenkins.public_ip}:8080"
}

output "jenkins_ssh" {
  description = "SSH command to connect to Jenkins"
  value       = "ssh -i <your-key.pem> ubuntu@${aws_eip.jenkins.public_ip}"
}
