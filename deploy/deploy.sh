#!/usr/bin/env bash
#
# Deploy da API em containers. Executado NA EC2, normalmente pelo pipeline (CD).
#
# Uso:
#   ./deploy.sh <imagem>
#   ./deploy.sh ghcr.io/acluiz/plotline-api:<sha>
#
# Pré-requisitos na EC2:
#   - Docker instalado e em execução
#   - $APP_DIR/.env com DATABASE_URL, DATABASE_SSL, DATABASE_SCHEMA, PORT
#   - $APP_DIR/docker-compose.yml (copiado junto com este script)
#   - login no registro da imagem, se ela for privada
#
# Variáveis opcionais:
#   APP_DIR  pasta da aplicação na EC2 (padrão: /opt/plotline-api)

set -euo pipefail

IMAGE="${1:?Uso: deploy.sh <imagem>}"
APP_DIR="${APP_DIR:-/opt/plotline-api}"
CONTAINER_NAME="plotline-api"
COMPOSE_VERSION="v2.29.7"
HEALTH_URL="http://localhost/api/v1/books"

cd "$APP_DIR"
export IMAGE

# 1. Garante o plugin do Docker Compose (o Amazon Linux traz só o Docker).
if ! docker compose version >/dev/null 2>&1; then
  echo "==> Instalando o plugin Docker Compose ${COMPOSE_VERSION}"
  sudo mkdir -p /usr/local/lib/docker/cli-plugins
  sudo curl -fsSL \
    "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-$(uname -m)" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

# 2. Baixa a nova imagem antes de mexer no container em execução.
echo "==> Baixando a imagem ${IMAGE}"
docker pull "$IMAGE"

# 3. Aplica as migrations do banco com um container descartável.
echo "==> Executando migrations"
docker run --rm --env-file .env "$IMAGE" \
  node node_modules/typeorm/cli.js migration:run \
  -d dist/infrastructure/database/data-source.js

# 4. Remove um container antigo criado fora do Compose (por `docker run`),
#    pois ele ocupa o mesmo nome e a mesma porta.
if docker inspect "$CONTAINER_NAME" >/dev/null 2>&1 &&
  [ -z "$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' "$CONTAINER_NAME")" ]; then
  echo "==> Removendo container antigo criado fora do Compose"
  docker rm -f "$CONTAINER_NAME"
fi

# 5. Sobe (ou atualiza) o container conforme o docker-compose.yml.
echo "==> Subindo o container"
docker compose up -d

# 6. Verifica se a API responde (qualquer resposta HTTP abaixo de 500).
echo "==> Verificando a API em ${HEALTH_URL}"
for i in $(seq 1 15); do
  status="$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" || true)"
  if [ "$status" != "000" ] && [ "$status" -lt 500 ]; then
    echo "API respondeu com HTTP ${status}."
    # 7. Remove imagens com mais de 7 dias que não estão em uso.
    docker image prune -af --filter "until=168h" >/dev/null || true
    exit 0
  fi
  echo "Tentativa ${i}: HTTP ${status}, aguardando..."
  sleep 4
done

echo "A API não respondeu a tempo. Últimos logs do container:" >&2
docker logs --tail 100 "$CONTAINER_NAME" >&2
exit 1
