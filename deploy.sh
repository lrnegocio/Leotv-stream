
#!/bin/bash

echo "🚀 INICIANDO RECALIBRAGEM SOBERANA v303..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# DESBLOQUEIO MASTER: Limpeza total de memória e conflitos
echo "🧹 LIMPANDO MEMÓRIA E CONFLITOS DE GIT..."
git fetch origin main
git reset --hard origin/main

# Liberação agressiva de RAM (Drop Caches)
sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true

# PAUSA PARA RESPIRAR: Para o serviço para ter RAM pro Build
echo "⏸️ PAUSANDO MOTORES PARA LIBERAR RAM (BUILD MODE)..."
pm2 stop leotv-master 2>/dev/null || true
pm2 delete leotv-master 2>/dev/null || true

# LIBERAÇÃO DE PORTA: Garante que nada ficou travado na porta 80 ou 3000
echo "🔓 LIMPANDO PORTAS 80 E 3000..."
fuser -k 80/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true

# Garante que o NPM e o PM2 estão no PATH
export PATH=$PATH:/usr/local/bin:/usr/bin

# Instala dependências de forma limpa
echo "📦 INSTALANDO DEPENDÊNCIAS..."
npm install --no-audit --no-fund --prefer-offline

# Build ultra-otimizado para 1GB de RAM
echo "🏗️ CONSTRUINDO NÚCLEO MASTER LÉO TV..."
export NODE_OPTIONS="--max-old-space-size=450"
npm run build

# Verifica se o build deu certo
if [ $? -eq 0 ]; then
    echo "✅ BUILD CONCLUÍDO COM SUCESSO!"
else
    echo "❌ ERRO NO BUILD. TENTANDO RECOVERY..."
    pm2 start ecosystem.config.js
    exit 1
fi

# Reinicia o processo no PM2 na porta interna 3000
echo "♻️ REINICIANDO MOTORES NA PORTA INTERNA 3000..."
pm2 start ecosystem.config.js --update-env
pm2 save

echo "--------------------------------------------------"
echo "✅ SISTEMA LÉO TV PRONTO PARA O DOMÍNIO!"
echo "🔗 AGORA EXECUTE OS COMANDOS DO NGINX NO PUTTY"
echo "--------------------------------------------------"
pm2 list
