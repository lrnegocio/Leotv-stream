
#!/bin/bash

echo "🚀 INICIANDO RECALIBRAGEM SOBERANA v385-S (FORCE ONLINE)..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# Permissão de Segurança Interna
chmod +x deploy.sh

# Limpeza Agressiva de Cache
echo "🧹 LIMPANDO CACHE E CONFLITOS DE GIT..."
git fetch origin main
git reset --hard origin/main

echo "🗑️ DELETANDO NODE_MODULES PARA INSTALAÇÃO LIMPA..."
rm -rf node_modules
rm -f package-lock.json

# Pausa Processos Antigos
echo "⏸️ PAUSANDO MOTOR LÉO TV..."
pm2 delete leotv-master 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true

# Instalação Limpa (Força Bruta Online)
echo "📦 INSTALANDO DEPENDÊNCIAS (MODO RECONEXÃO)..."
# Usamos legacy-peer-deps para ignorar conflitos de versões e baixar o que estiver disponível
npm install --legacy-peer-deps --no-audit --no-fund

# Build do Núcleo
echo "🏗️ CONSTRUINDO NÚCLEO MASTER..."
export NODE_OPTIONS="--max-old-space-size=450"
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD CONCLUÍDO COM SUCESSO v385-S!"
else
    echo "❌ ERRO NO BUILD. TENTANDO RECOVERY EMERGÊNCIAL..."
    pm2 start npm --name "leotv-master" -- start
    exit 1
fi

# Reinicia Processos
echo "♻️ REINICIANDO MOTOR LÉO TV..."
pm2 start npm --name "leotv-master" -- start
pm2 save

echo "--------------------------------------------------"
echo "✅ SISTEMA LÉO TV PRONTO v385-S!"
echo "🔗 ACESSE: https://leotv.fun"
echo "--------------------------------------------------"
pm2 list
