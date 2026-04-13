
#!/bin/bash

echo "🚀 ATUALIZAÇÃO SOBERANA LÉO TV v174..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# Puxa as últimas mudanças do GitHub
echo "📥 SINCRONIZANDO COM O NÚCLEO GITHUB..."
git pull origin main

# Instala dependências de forma limpa e otimizada para pouca RAM
echo "📦 INSTALANDO DEPENDÊNCIAS..."
npm install --no-audit --no-fund --prefer-offline

# Build ultra-otimizado para 1GB de RAM
# Usamos o limite de 512MB para o processo de build não crashar a VPS
echo "🏗️ CONSTRUINDO NÚCLEO MASTER LÉO TV (MODO LOW-RAM)..."
NODE_OPTIONS="--max-old-space-size=512" npm run build

# Reinicia o processo no PM2
echo "♻️ REINICIANDO MOTORES..."
pm2 restart leotv-master --update-env || pm2 start ecosystem.config.js

echo "✅ SISTEMA LÉO TV ONLINE NO IP 24.152.37.78!"
