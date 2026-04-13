
#!/bin/bash

echo "🚀 ATUALIZAÇÃO SOBERANA LÉO TV v188..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# DESBLOQUEIO MASTER: Força a VPS a ficar idêntica ao GitHub, ignorando erros locais
echo "🧹 LIMPANDO CONFLITOS E FORÇANDO NÚCLEO..."
git fetch origin main
git reset --hard origin/main

# Garante que o NPM e o PM2 estão no PATH
export PATH=$PATH:/usr/local/bin:/usr/bin

# Instala dependências de forma limpa
echo "📦 INSTALANDO DEPENDÊNCIAS..."
npm install --no-audit --no-fund --prefer-offline

# Build ultra-otimizado para 1GB de RAM
echo "🏗️ CONSTRUINDO NÚCLEO MASTER LÉO TV (MODO LOW-RAM)..."
NODE_OPTIONS="--max-old-space-size=512" npm run build

# Reinicia o processo no PM2 na PORTA 80
echo "♻️ REINICIANDO MOTORES NA PORTA 80..."
pm2 delete leotv-master 2>/dev/null
pm2 start ecosystem.config.js --update-env
pm2 save

echo "✅ SISTEMA LÉO TV ONLINE NO IP: 24.152.37.78"
echo "🔗 ACESSE: http://24.152.37.78"
