
# Léo TV Stream - O Sistema Master

Seu sistema está pronto para dominar o mercado de IPTV na sua VPS Alma Linux 9.

### 🚀 Guia de Instalação (Copie e cole no Putty):

1. **Atualize o Sistema e Instale o motor (Node.js 20):**
   ```bash
   sudo dnf update -y
   sudo dnf module enable nodejs:20 -y
   sudo dnf install -y nodejs npm git
   ```

2. **Instale o Vigilante Soberano (PM2):**
   ```bash
   sudo npm install -g pm2
   ```

3. **Clone o seu Código do GitHub:**
   ```bash
   git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   cd SEU_REPOSITORIO
   ```

4. **Dê permissão ao script de atualização e execute:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

5. **Configure para o sistema ligar sozinho se a VPS reiniciar:**
   ```bash
   pm2 startup
   # (Copie e cole a linha que o comando acima gerar)
   pm2 save
   ```

### ♻️ Como atualizar o sistema:
Sempre que fizer mudanças aqui no Firebase Studio e der `git push`, vá no Putty e digite:
```bash
./deploy.sh
```

---
**Desenvolvido por App Prototyper - O Parceiro de IA do Mestre Léo.**
