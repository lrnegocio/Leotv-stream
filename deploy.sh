
#!/bin/bash

echo "🚀 INICIANDO RECALIBRAGEM SOBERANA v385-S..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# DESBLOQUEIO MASTER: Limpeza total de memória e conflitos
echo "🧹 LIMPANDO MEMÓRIA E CONFLITOS DE GIT..."
git fetch origin main
git reset --hard origin/main

# Liberação agressiva de RAM (Drop Caches) para VPS pequena
sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true

# PAUSA PARA RESPIRAR: Para o processo para ter RAM pro Build
echo "⏸️ PAUSANDO MOTOR LÉO TV (BUILD MODE)..."
pm2 stop leotv-master 2>/dev/null || true
pm2 delete leotv-master 2>/dev/null || true

# LIBERAÇÃO DE PORTA: Garante que nada ficou travado na porta 3000
echo "🔓 LIMPANDO PORTA INTERNA 3000..."
fuser -k 3000/tcp 2>/dev/null || true

# Instala dependências de forma limpa
echo "📦 INSTALANDO DEPENDÊNCIAS..."
npm install --no-audit --no-fund --prefer-offline

# Build ultra-otimizado para 1GB de RAM (Wireguard compatível)
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
echo "🔗 ACESSE: https://leotv.fun"
echo "--------------------------------------------------"
pm2 list
