#!/bin/bash

echo "🚀 INICIANDO RECALIBRAGEM SOBERANA v385-S (MODO AUTO-RELIEF)..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# Permissão automática
chmod +x deploy.sh 2>/dev/null
chmod +x maintenance.sh 2>/dev/null

# ALÍVIO DE CPU E RAM: Para tudo o que estiver consumindo recursos
echo "🧊 CONGELANDO PROCESSOS DE ALTO CONSUMO (FFMPEG/NODE)..."
pkill -9 ffmpeg 2>/dev/null || true
pkill -9 node 2>/dev/null || true

# Limpeza agressiva de cache e memória do sistema (Ubuntu/Debian)
echo "🧹 LIMPANDO MEMÓRIA RAM DO SISTEMA..."
sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true

echo "🗑️ DELETANDO NODE_MODULES PARA INSTALAÇÃO LIMPA..."
rm -rf node_modules 2>/dev/null
rm -f package-lock.json 2>/dev/null

# Instalação Otimizada (Baixo consumo de RAM)
echo "📦 INSTALANDO DEPENDÊNCIAS (MODO ECONÔMICO)..."
# Usamos flags para economizar memória e ignorar avisos inúteis
npm install --legacy-peer-deps --no-audit --no-fund --loglevel error

# Build do Núcleo Master com Limite de Memória
echo "🏗️ CONSTRUINDO NÚCLEO MASTER LÉO TV..."
# Limitamos a RAM do build para 1GB para não capotar a VPS
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
