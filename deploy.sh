
#!/bin/bash

echo "🚀 ATUALIZAÇÃO SOBERANA LÉO TV v173..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# Puxa as últimas mudanças do GitHub
echo "📥 SINCRONIZANDO COM O NÚCLEO GITHUB..."
git pull origin main

# Instala dependências de forma limpa
echo "📦 INSTALANDO DEPENDÊNCIAS..."
npm install --no-audit --no-fund

# Build otimizado para economizar RAM durante o processo
echo "🏗️ CONSTRUINDO NÚCLEO MASTER LÉO TV..."
NODE_OPTIONS="--max-old-space-size=512" npm run build

# Reinicia o processo no PM2
echo "♻️ REINICIANDO MOTORES..."
pm2 restart leotv-master --update-env || pm2 start ecosystem.config.js

echo "✅ SISTEMA LÉO TV ONLINE NO IP 24.152.37.78!"
