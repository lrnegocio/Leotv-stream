
#!/bin/bash

echo "🚀 INICIANDO RECALIBRAGEM SOBERANA v385-S (FORCE ONLINE)..."

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# Limpeza Agressiva
echo "🧹 LIMPANDO CACHE E CONFLITOS..."
rm -rf node_modules
rm -f package-lock.json
git fetch origin main
git reset --hard origin/main

# Instalação Limpa
echo "📦 INSTALANDO DEPENDÊNCIAS (MODO INQUEBRÁVEL)..."
npm install --legacy-peer-deps --no-audit --no-fund

# Build do Núcleo
echo "🏗️ CONSTRUINDO NÚCLEO MASTER..."
export NODE_OPTIONS="--max-old-space-size=450"
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD CONCLUÍDO COM SUCESSO v385-S!"
else
    echo "❌ ERRO NO BUILD. TENTANDO RECOVERY..."
    pm2 restart leotv-master || pm2 start npm --name "leotv-master" -- start
    exit 1
fi

# Reinicia Processos
echo "♻️ REINICIANDO MOTOR LÉO TV..."
pm2 delete leotv-master 2>/dev/null || true
pm2 start npm --name "leotv-master" -- start
pm2 save

echo "--------------------------------------------------"
echo "✅ SISTEMA LÉO TV PRONTO v385-S!"
echo "🔗 ACESSE: https://leotv.fun"
echo "--------------------------------------------------"
pm2 list
