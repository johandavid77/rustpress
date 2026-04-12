#!/bin/bash
# Ejecutar una sola vez para obtener certificado SSL
source .env.prod

docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm certbot \
  certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@${DOMAIN} \
  --agree-tos \
  --no-eff-email \
  -d ${DOMAIN} \
  -d www.${DOMAIN}

echo "✅ SSL obtenido para ${DOMAIN}"
