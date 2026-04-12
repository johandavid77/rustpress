#!/bin/bash
set -e

echo "🚀 RustCMS Deploy"

# Cargar variables
if [ ! -f .env.prod ]; then
  echo "❌ .env.prod no existe. Copia .env.prod.example y completa los valores."
  exit 1
fi

source .env.prod

# Pull latest
git pull origin main

# Build y levantar
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

echo "✅ Deploy completado"
echo "🌐 https://${DOMAIN}"
