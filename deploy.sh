
#!/bin/bash

echo "🚀 INICIANDO ATUALIZAÇÃO SOBERANA NA VPS LINUX (ALMA/UBUNTU)..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# Puxa as últimas mudanças do GitHub
echo "📥 SINCRONIZANDO COM O NÚCLEO GITHUB..."
git pull origin main

# Instala dependências de forma limpa
echo "📦 INSTALANDO DEPENDÊNCIAS..."
npm install --frozen-lockfile || npm install

# Build otimizado para produção
echo "🏗️  CONSTRUINDO NÚCLEO MASTER LÉO TV..."
npm run build

# Reinicia ou inicia o processo no PM2 com configuração de cluster
if pm2 list | grep -q "leotv-master"; then
    echo "♻️  REINICIANDO MOTORES EM MODO CLUSTER..."
    pm2 restart ecosystem.config.js --env production
else
    echo "⚡ INICIANDO SISTEMA PELA PRIMEIRA VEZ..."
    pm2 start ecosystem.config.js --env production
fi

# Salva a lista para ligar sozinho se a VPS reiniciar
pm2 save

echo "✅ SISTEMA LÉO TV v171 ONLINE E VOANDO NA VPS!"
