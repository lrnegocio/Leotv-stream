#!/bin/bash

echo "🚀 INICIANDO RECALIBRAGEM SOBERANA v385-S (MODO LIVRE)..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# Permissão
chmod +x deploy.sh 2>/dev/null

# Limpeza de Processos que travam CPU
echo "🧊 CONGELANDO PROCESSOS DE ALTO CONSUMO (FFMPEG/RADIO)..."
pkill -9 ffmpeg 2>/dev/null || true
pkill -9 node 2>/dev/null || true

# Limpeza Agressiva
echo "🧹 LIMPANDO CACHE E CONFLITOS DE GIT..."
git fetch origin main
git reset --hard origin/main

echo "🗑️ DELETANDO NODE_MODULES PARA INSTALAÇÃO LIMPA..."
rm -rf node_modules
rm -f package-lock.json

# Instalação Limpa (Força Bruta Online)
echo "📦 INSTALANDO DEPENDÊNCIAS (MODO RECONEXÃO)..."
# Usamos legacy-peer-deps para ignorar conflitos de versões e baixar o que estiver disponível
npm install --legacy-peer-deps --no-audit --no-fund

# Build do Núcleo
echo "🏗️ CONSTRUINDO NÚCLEO MASTER..."
# Aumentamos a RAM para o build não capotar na VPS pequena
export NODE_OPTIONS="--max-old-space-size=1024"
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD CONCLUÍDO COM SUCESSO v385-S!"
else
    echo "❌ ERRO NO BUILD. TENTANDO RECOVERY EMERGÊNCIAL..."
    pm2 delete leotv-master 2>/dev/null || true
    pm2 start npm --name "leotv-master" -- start
    exit 1
fi

# Reinicia Processos
echo "♻️ REINICIANDO MOTOR LÉO TV..."
pm2 delete leotv-master 2>/dev/null || true
pm2 start npm --name "leotv-master" -- start
pm2 save

echo "--------------------------------------------------"
echo "✅ SISTEMA LÉO TV PRONTO v385-S!"
echo "🔗 ACESSE: https://leotv.fun"
echo "--------------------------------------------------"
pm2 list