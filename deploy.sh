#!/bin/bash

echo "🚀 INICIANDO RECALIBRAGEM SOBERANA v385-S (MODO ULTRA-RELIEF)..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# Permissão automática
chmod +x deploy.sh 2>/dev/null
chmod +x maintenance.sh 2>/dev/null

# ALÍVIO AGRESSIVO DE CPU E RAM
echo "🧊 CONGELANDO PROCESSOS DE ALTO CONSUMO (FFMPEG/NODE)..."
pkill -9 ffmpeg 2>/dev/null || true
pkill -9 node 2>/dev/null || true

# Limpeza profunda de cache de memória do sistema
echo "🧹 LIMPANDO MEMÓRIA RAM DO SISTEMA..."
sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true

# Deleta node_modules para garantir instalação limpa e evitar conflitos de versão
echo "🗑️ LIMPANDO AMBIENTE DE MÓDULOS..."
rm -rf node_modules 2>/dev/null
rm -f package-lock.json 2>/dev/null

# Instalação Otimizada (Modo Econômico para VPS)
echo "📦 INSTALANDO DEPENDÊNCIAS (MODO FORCE)..."
npm install --legacy-peer-deps --no-audit --no-fund --loglevel error --prefer-offline || npm install --legacy-peer-deps --no-audit --no-fund

# Build do Núcleo Master com Limite Estrito de Memória
echo "🏗️ CONSTRUINDO NÚCLEO MASTER LÉO TV..."
# Limitamos a RAM do build para evitar que a VPS trave
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

# Reinicia Processos no PM2
echo "♻️ REINICIANDO MOTOR LÉO TV..."
pm2 delete leotv-master 2>/dev/null || true
pm2 start npm --name "leotv-master" -- start
pm2 save

echo "--------------------------------------------------"
echo "✅ SISTEMA LÉO TV PRONTO v385-S!"
echo "🔗 ACESSE: https://leotv.fun"
echo "--------------------------------------------------"
pm2 list