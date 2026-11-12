output "public_ip" {
  description = "IP público fixo da instância."
  value       = aws_eip.api.public_ip
}

output "ssh_command" {
  description = "Comando para acessar a instância."
  value       = "ssh -i ~/.ssh/plotline-ec2 ec2-user@${aws_eip.api.public_ip}"
}

output "api_url" {
  description = "URL base da API depois do deploy."
  value       = "http://${aws_eip.api.public_ip}/api/v1"
}
