
#!/bin/bash

echo "🚀 INICIANDO RECALIBRAGEM SOBERANA v385-S (ONLINE FORCE)..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# Permissão de Segurança
chmod +x deploy.sh

# Limpeza Agressiva de Cache
echo "🧹 LIMPANDO MEMÓRIA E CONFLITOS DE GIT..."
git fetch origin main
git reset --hard origin/main

echo "🗑️ DELETANDO CACHE DE MÓDULOS PARA FORÇAR INSTALAÇÃO LIMPA..."
rm -rf node_modules
rm -f package-lock.json

# Pausa Processos Antigos
echo "⏸️ PAUSANDO MOTOR LÉO TV..."
pm2 delete leotv-master 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true

# Instalação Limpa (Força Bruta)
echo "📦 INSTALANDO DEPENDÊNCIAS (MODO RECONEXÃO)..."
# Usamos legacy-peer-deps para ignorar conflitos de versões de IA que travam o NPM
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
