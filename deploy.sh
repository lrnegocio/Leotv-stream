
#!/bin/bash

echo "🚀 INICIANDO RECALIBRAGEM SOBERANA v385-S (VPS leonet)..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# DESBLOQUEIO MASTER: Limpeza total de memória e conflitos
echo "🧹 LIMPANDO MEMÓRIA E CONFLITOS DE GIT..."
git fetch origin main
git reset --hard origin/main

# Garante que o NPM e o PM2 estão no PATH (Fix para Ubuntu 24.04)
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

# Liberação agressiva de RAM (Drop Caches) para manter Wireguard liso
sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true

# PAUSA PARA RESPIRAR: Para o processo para ter RAM pro Build (450MB Max)
echo "⏸️ PAUSANDO MOTOR LÉO TV (BUILD MODE)..."
pm2 stop leotv-master 2>/dev/null || true
pm2 delete leotv-master 2>/dev/null || true

# LIBERAÇÃO DE PORTA: Garante que nada ficou travado na porta 3000
echo "🔓 LIMPANDO PORTA INTERNA 3000..."
fuser -k 3000/tcp 2>/dev/null || true

# Instala dependências de forma limpa (Fix Radix UI)
echo "📦 INSTALANDO DEPENDÊNCIAS..."
npm install --no-audit --no-fund --prefer-offline

# Build ultra-otimizado para 1GB de RAM (Wireguard amigável)
echo "🏗️ CONSTRUINDO NÚCLEO MASTER LÉO TV..."
export NODE_OPTIONS="--max-old-space-size=450"
npm run build

# Verifica se o build deu certo
if [ $? -eq 0 ]; then
    echo "✅ BUILD CONCLUÍDO COM SUCESSO v385-S!"
else
    echo "❌ ERRO NO BUILD. TENTANDO RECOVERY..."
    pm2 start npm --name "leotv-master" -- start
    exit 1
fi

# Reinicia o processo na porta 3000
echo "♻️ REINICIANDO MOTOR LÉO TV NA PORTA INTERNA 3000..."
pm2 start npm --name "leotv-master" -- start
pm2 save

echo "--------------------------------------------------"
echo "✅ SISTEMA LÉO TV PRONTO E SINCRONIZADO v385-S!"
echo "🔗 ACESSE: http://177.153.202.104:3000"
echo "📡 DOMÍNIO: leotv.fun"
echo "--------------------------------------------------"
pm2 list
