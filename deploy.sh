
#!/bin/bash

echo "🚀 INICIANDO RECALIBRAGEM SOBERANA v385-S (VPS leonet)..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# DESBLOQUEIO MASTER
echo "🧹 LIMPANDO MEMÓRIA E CONFLITOS DE GIT..."
git fetch origin main
git reset --hard origin/main

# Garante ferramentas no PATH
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

# Liberação agressiva de RAM
sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true

# Pausa processos para o build
echo "⏸️ PAUSANDO MOTOR LÉO TV (BUILD MODE)..."
pm2 stop leotv-master 2>/dev/null || true

# Limpa porta
fuser -k 3000/tcp 2>/dev/null || true

# Instala dependências de forma limpa
echo "📦 INSTALANDO DEPENDÊNCIAS..."
npm install --no-audit --no-fund --prefer-offline

# Build otimizado para 1GB de RAM
echo "🏗️ CONSTRUINDO NÚCLEO MASTER LÉO TV..."
export NODE_OPTIONS="--max-old-space-size=450"
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD CONCLUÍDO COM SUCESSO v385-S!"
else
    echo "❌ ERRO NO BUILD. TENTANDO RECOVERY..."
    pm2 start leotv-master 2>/dev/null || true
    exit 1
fi

# Reinicia
echo "♻️ REINICIANDO MOTOR LÉO TV..."
pm2 restart leotv-master 2>/dev/null || pm2 start npm --name "leotv-master" -- start
pm2 save

echo "--------------------------------------------------"
echo "✅ SISTEMA LÉO TV PRONTO v385-S!"
echo "🔗 ACESSE SEU DOMÍNIO NA PORTA 3000"
echo "--------------------------------------------------"
pm2 list
