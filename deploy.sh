
#!/bin/bash

echo "🚀 ATUALIZAÇÃO SOBERANA LÉO TV v178..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# Puxa as últimas mudanças do GitHub
echo "📥 SINCRONIZANDO COM O NÚCLEO GITHUB..."
git pull origin main

# Verifica se o NPM existe, se não, tenta carregar o caminho padrão
if ! command -v npm &> /dev/null
then
    export PATH=$PATH:/usr/local/bin:/usr/bin
fi

# Instala dependências de forma limpa e otimizada para pouca RAM (1GB)
echo "📦 INSTALANDO DEPENDÊNCIAS..."
npm install --no-audit --no-fund --prefer-offline

# Build ultra-otimizado para 1GB de RAM
echo "🏗️ CONSTRUINDO NÚCLEO MASTER LÉO TV (MODO LOW-RAM)..."
NODE_OPTIONS="--max-old-space-size=512" npm run build

# Reinicia o processo no PM2 (Vigilante Soberano)
echo "♻️ REINICIANDO MOTORES NA PORTA 80..."
pm2 restart leotv-master --update-env || pm2 start ecosystem.config.js

pm2 save

echo "✅ SISTEMA LÉO TV ONLINE NO IP: 24.152.37.78"
echo "🔗 ACESSE: http://24.152.37.78"
