#!/bin/bash

echo "🚀 INICIANDO RECALIBRAGEM SOBERANA v385-S (MODO CPU-RELIEF)..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# 🧊 PROTOCOLO DE ALÍVIO VPS (MESTRE LÉO)
echo "🧊 CONGELANDO PROCESSOS PESADOS (FFMPEG & OLD NODE)..."
# Para a rádio sem excluir nada, apenas liberando a CPU
pkill -9 ffmpeg 2>/dev/null || true
pkill -9 node 2>/dev/null || true

# 🧹 LIMPEZA TOTAL DE PROCESSOS FANTASMAS
echo "🧹 EXTERMINANDO CONFLITOS NO PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
# Limpa a porta 3000 na força bruta
fuser -k 3000/tcp 2>/dev/null || true

# 🧹 ALÍVIO DE MEMÓRIA RAM
sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true

# Limpeza de Cache de Módulos
rm -rf node_modules 2>/dev/null
rm -f package-lock.json 2>/dev/null

# Instalação Silenciosa e Leve
echo "📦 INSTALANDO PEÇAS DO MOTOR (FORCE BRUTE)..."
npm install --legacy-peer-deps --no-audit --no-fund --loglevel error

# Build do Núcleo
echo "🏗️ CONSTRUINDO NÚCLEO MASTER LÉO TV..."
export NODE_OPTIONS="--max-old-space-size=1024"
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD CONCLUÍDO COM SUCESSO v385-S!"
else
    echo "❌ ERRO NO BUILD. VERIFIQUE A MEMÓRIA RAM."
    exit 1
fi

# Reinicia Processos no PM2 de forma unificada
echo "♻️ REINICIANDO MOTOR LÉO TV UNIFICADO..."
pm2 start npm --name "leotv-master" -- start -- -p 3000
pm2 save

echo "--------------------------------------------------"
echo "✅ SISTEMA LÉO TV PRONTO E CPU LIBERADA v385-S!"
echo "🔗 ACESSE AGORA: http://177.153.202.104:3000"
echo "--------------------------------------------------"
pm2 list
