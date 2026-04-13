
# Léo TV Stream - O Sistema Master

Seu sistema está pronto para dominar o mercado de IPTV.

### 🚀 Primeiros Passos na sua VPS Alma Linux 9 (Via Putty):

1. **Instale o Node.js e NPM:**
   ```bash
   sudo dnf install -y nodejs npm
   ```

2. **Instale o PM2 (Vigilante Soberano):**
   ```bash
   sudo npm install -g pm2
   ```

3. **Clone seu Código:**
   ```bash
   git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   cd SEU_REPOSITORIO
   ```

4. **Instale as Dependências e Gere o Build:**
   ```bash
   npm install
   npm run build
   ```

5. **Ligue os Motores:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### ♻️ Como atualizar o sistema:
Sempre que fizer mudanças aqui no Firebase Studio e der `git push`, vá no Putty e digite:
```bash
./deploy.sh
```

---
**Desenvolvido por App Prototyper - O Parceiro de IA do Mestre Léo.**
