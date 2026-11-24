# Deploy da API em containers

Scripts usados pelo pipeline de CD (`.github/workflows/deploy.yml`) para colocar a API no ar na EC2.

| Arquivo | Função |
| --- | --- |
| `docker-compose.yml` | Descreve o container da API: imagem, porta 80 → 3000, arquivo `.env` e reinício automático. |
| `deploy.sh` | Executa o deploy na EC2: baixa a imagem, aplica as migrations, sobe o container e verifica se a API responde. |

## Como o pipeline usa estes arquivos

1. O job de deploy grava o `.env` na EC2 em `/opt/plotline-api`, a partir dos GitHub Secrets.
2. Copia `docker-compose.yml` e `deploy.sh` para a mesma pasta.
3. Executa `deploy.sh` com a imagem gerada para o commit (`ghcr.io/<dono>/plotline-api:<sha>`).

## O que o `deploy.sh` faz

1. Instala o plugin do Docker Compose, se ele ainda não existir.
2. Baixa a imagem (`docker pull`).
3. Aplica as migrations do banco com um container descartável.
4. Remove um container antigo criado fora do Compose, se houver.
5. Sobe o container com `docker compose up -d`.
6. Consulta a API (`/api/v1/books`). Se não responder em cerca de 60 segundos, mostra os logs do container e termina com erro.
7. Remove imagens antigas.

## Uso manual

Na EC2, com o `.env` já criado em `/opt/plotline-api`:

```bash
cd /opt/plotline-api
./deploy.sh ghcr.io/<dono>/plotline-api:<sha>
```

Para voltar a uma versão anterior, execute o script com a tag (sha) desejada.

Logs da aplicação:

```bash
docker logs -f plotline-api
```
