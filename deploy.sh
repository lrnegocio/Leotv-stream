
#!/bin/bash

echo "🚀 INICIANDO ATUALIZAÇÃO SOBERANA NA VPS..."

# Puxa as últimas mudanças do GitHub
git pull origin main

# Instala dependências se houver novas
npm install

# Build do sistema NextJS
npm run build

# Reinicia o processo no PM2
pm2 restart ecosystem.config.js

echo "✅ SISTEMA LÉO TV ATUALIZADO E RODANDO NA VPS!"
