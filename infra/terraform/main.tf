# EnergiaNostra Terraform — Hetzner Cloud Infrastructure
#
# Usage:
#   cd infra/terraform
#   terraform init
#   terraform plan -var-file="staging.tfvars"
#   terraform apply -var-file="staging.tfvars"

terraform {
  required_version = ">= 1.5"
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
  }
}

variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  default     = "staging"
}

variable "server_type" {
  description = "Server type (cx22, cx32, cx42)"
  type        = string
  default     = "cx22"
}

variable "location" {
  description = "Hetzner datacenter location"
  type        = string
  default     = "nbg1" # Nuremberg (closest to Italy)
}

variable "ssh_key_name" {
  description = "SSH key name in Hetzner"
  type        = string
}

provider "hcloud" {
  token = var.hcloud_token
}

# ── Network ──

resource "hcloud_network" "main" {
  name     = "energianostra-${var.environment}"
  ip_range = "10.0.0.0/16"
}

resource "hcloud_network_subnet" "app" {
  network_id   = hcloud_network.main.id
  type         = "cloud"
  network_zone = "eu-central"
  ip_range     = "10.0.1.0/24"
}

# ── Firewall ──

resource "hcloud_firewall" "app" {
  name = "energianostra-${var.environment}-fw"

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

# ── Application Server ──

data "hcloud_ssh_key" "default" {
  name = var.ssh_key_name
}

resource "hcloud_server" "app" {
  name        = "energianostra-${var.environment}"
  server_type = var.server_type
  location    = var.location
  image       = "docker-ce"

  ssh_keys    = [data.hcloud_ssh_key.default.id]
  firewall_ids = [hcloud_firewall.app.id]

  network {
    network_id = hcloud_network.main.id
  }

  user_data = <<-EOF
    #!/bin/bash
    apt-get update && apt-get install -y docker-compose-plugin
    mkdir -p /opt/energianostra
    echo "Server ready for EnergiaNostra deployment"
  EOF

  labels = {
    app         = "energianostra"
    environment = var.environment
  }
}

# ── Managed PostgreSQL ──

resource "hcloud_volume" "db" {
  name     = "energianostra-${var.environment}-db"
  size     = 20
  location = var.location
  format   = "ext4"
}

resource "hcloud_volume_attachment" "db" {
  volume_id = hcloud_volume.db.id
  server_id = hcloud_server.app.id
  automount = true
}

# ── Outputs ──

output "server_ip" {
  value       = hcloud_server.app.ipv4_address
  description = "Public IP of the application server"
}

output "server_status" {
  value       = hcloud_server.app.status
  description = "Server status"
}

output "volume_id" {
  value       = hcloud_volume.db.id
  description = "Database volume ID"
}
