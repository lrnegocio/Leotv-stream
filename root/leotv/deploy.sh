
#!/bin/bash

echo "🚀 INICIANDO RECALIBRAGEM SOBERANA v385-S (FORCE ROOT)..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# Limpeza Total
echo "🧹 LIMPANDO CACHE E GIT..."
git fetch origin main
git reset --hard origin/main
rm -rf node_modules
rm -f package-lock.json

# RAM e PM2
sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true
pm2 stop leotv-master 2>/dev/null || true
pm2 delete leotv-master 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true

# Instalação Limpa
echo "📦 INSTALANDO DEPENDÊNCIAS..."
npm install --legacy-peer-deps

# Build
echo "🏗️ CONSTRUINDO NÚCLEO MASTER..."
export NODE_OPTIONS="--max-old-space-size=450"
npm run build

# Start
pm2 start npm --name "leotv-master" -- start
pm2 save
pm2 list
