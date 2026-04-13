
#!/bin/bash

echo "🚀 ATUALIZAÇÃO SOBERANA LÉO TV v177..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# Puxa as últimas mudanças do GitHub
echo "📥 SINCRONIZANDO COM O NÚCLEO GITHUB..."
git pull origin main

# Instala dependências de forma limpa e otimizada para pouca RAM (1GB)
echo "📦 INSTALANDO DEPENDÊNCIAS..."
npm install --no-audit --no-fund --prefer-offline

# Build ultra-otimizado para 1GB de RAM
# Limitamos a memória do processo de build para a VPS não travar
echo "🏗️ CONSTRUINDO NÚCLEO MASTER LÉO TV (MODO LOW-RAM)..."
NODE_OPTIONS="--max-old-space-size=512" npm run build

# Reinicia o processo no PM2 (Vigilante Soberano)
echo "♻️ REINICIANDO MOTORES..."
pm2 restart leotv-master --update-env || pm2 start ecosystem.config.js

echo "✅ SISTEMA LÉO TV ONLINE E SINTONIZADO!"
