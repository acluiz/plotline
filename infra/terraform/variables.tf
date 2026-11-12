variable "aws_region" {
  description = "Região da AWS onde a instância será criada."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefixo usado no nome dos recursos."
  type        = string
  default     = "plotline-api"
}

variable "instance_type" {
  description = "Tipo da instância EC2 (t3.micro entra no Free Tier em várias contas)."
  type        = string
  default     = "t3.micro"
}

variable "ssh_public_key" {
  description = "Conteúdo da chave pública SSH (ssh-ed25519 AAAA...). No CI é derivada do secret EC2_SSH_KEY."
  type        = string
}

variable "ssh_allowed_cidrs" {
  description = <<-EOT
    Faixas de IP liberadas na porta 22. O GitHub Actions usa IPs variáveis,
    por isso o padrão é 0.0.0.0/0 (acesso só com chave, senha desativada).
  EOT
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
