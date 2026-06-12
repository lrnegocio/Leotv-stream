
#!/bin/bash

echo "🚀 INICIANDO RECALIBRAGEM SOBERANA v385-S (MODO IP-READY)..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# Alívio de Memória e Processos
echo "🧹 LIMPANDO MEMÓRIA E PROCESSOS ANTIGOS..."
pkill -9 node 2>/dev/null || true
pkill -9 ffmpeg 2>/dev/null || true
sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true

# Limpeza de Cache de Módulos
echo "🗑️ LIMPANDO AMBIENTE DE MÓDULOS..."
rm -rf node_modules 2>/dev/null
rm -f package-lock.json 2>/dev/null

# Instalação Silenciosa e Leve
echo "📦 INSTALANDO DEPENDÊNCIAS (MODO FORCE BRUTE)..."
npm install --legacy-peer-deps --no-audit --no-fund --loglevel error

# Build do Núcleo
echo "🏗️ CONSTRUINDO NÚCLEO MASTER LÉO TV..."
export NODE_OPTIONS="--max-old-space-size=1024"
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD CONCLUÍDO COM SUCESSO v385-S!"
else
    echo "❌ ERRO NO BUILD. VERIFIQUE OS LOGS."
    exit 1
fi

# Reinicia Processos no PM2 de forma limpa
echo "♻️ REINICIANDO MOTOR LÉO TV..."
pm2 delete leotv-master 2>/dev/null || true
pm2 start npm --name "leotv-master" -- start -- -p 3000
pm2 save

echo "--------------------------------------------------"
echo "✅ SISTEMA LÉO TV PRONTO v385-S!"
echo "🔗 ACESSE VIA IP: http://177.153.202.104:3000"
echo "--------------------------------------------------"
pm2 list
