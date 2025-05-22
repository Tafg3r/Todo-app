terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.2"
    }
  }
}

provider "docker" {}

resource "docker_network" "backend" {
  name = "network-backend"
}

# MongoDB
resource "docker_image" "mongo" {
  name = "mongo"
}

resource "docker_container" "mongo" {
  name  = "mongo"
  image = docker_image.mongo.image_id
  restart = "always"
  env = [
    "MONGODB_INITDB_ROOT_USERNAME=username",
    "MONGODB_INITDB_ROOT_PASSWORD=password"
  ]
  volumes {
    container_path = "/data/db"
    host_path      = "${path.module}/data/mongodb_data"
  }
  networks_advanced {
    name = docker_network.backend.name
  }
  ports {
    internal = 27017
    external = 27017
  }
}

# Prometheus
resource "docker_image" "prometheus" {
  name = "prom/prometheus:latest"
}

resource "docker_container" "prometheus" {
  name  = "prometheus"
  image = docker_image.prometheus.image_id
  volumes {
    container_path = "/etc/prometheus/prometheus.yml"
    host_path      = "${path.module}/../prometheus.yml"
  }
  ports {
    internal = 9090
    external = 9090
  }
  networks_advanced {
    name = docker_network.backend.name
  }
}

# Node Exporter
resource "docker_image" "node_exporter" {
  name = "prom/node-exporter"
}

resource "docker_container" "node_exporter" {
  name  = "node-exporter"
  image = docker_image.node_exporter.image_id
  ports {
    internal = 9100
    external = 9101
  }
  networks_advanced {
    name = docker_network.backend.name
  }
}

# API (backend)
resource "docker_image" "api" {
  name = "todo-api"
  build {
    context = "${path.module}/../backend"
  }
}

resource "docker_container" "api" {
  name  = "api"
  image = docker_image.api.image_id
  depends_on = [docker_container.mongo]
  ports {
    internal = 3001
    external = 3001
  }
  networks_advanced {
    name = docker_network.backend.name
  }
}

# Web (frontend)
resource "docker_image" "web" {
  name = "todo-web"
  build {
    context = "${path.module}/../frontend"
  }
}

resource "docker_container" "web" {
  name  = "web"
  image = docker_image.web.image_id
  depends_on = [docker_container.api]
  ports {
    internal = 3000
    external = 3000
  }
  networks_advanced {
    name = docker_network.backend.name
  }
}