
#!/bin/bash

echo "🚀 ATUALIZAÇÃO SOBERANA LÉO TV v172..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# Puxa as últimas mudanças do GitHub
echo "📥 SINCRONIZANDO COM O NÚCLEO GITHUB..."
git pull origin main

# Instala dependências de forma limpa (sem gastar muita RAM)
echo "📦 INSTALANDO DEPENDÊNCIAS..."
npm install --no-audit --no-fund

# Build otimizado para produção
echo "🏗️ CONSTRUINDO NÚCLEO MASTER LÉO TV..."
npm run build

# Reinicia o processo no PM2
echo "♻️ REINICIANDO MOTORES..."
pm2 restart leotv-master --update-env

echo "✅ SISTEMA LÉO TV ONLINE E VOANDO NA VPS!"
