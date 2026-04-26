
# Léo TV Stream - O Sistema Master (Edição Domínio leotv.fun)

### 🛠️ 1. Desbloqueio Total (No Putty):
Copie e cole estes comandos um por um para abrir o Firewall:
```bash
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload
```

### 📦 2. Atualização e Ativação do Sistema:
```bash
cd ~/leotv
git fetch origin main
git reset --hard origin/main
chmod +x deploy.sh
./deploy.sh
```

### 🌐 3. Ativação do Domínio e SSL (HTTPS)
Após rodar o deploy, execute estes comandos no Putty para ativar o cadeado:
```bash
# 1. Cria a configuração do Nginx
cat <<EOF > /etc/nginx/conf.d/leotv.conf
server {
    listen 80;
    server_name leotv.fun www.leotv.fun;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 2. Reinicia o Nginx
systemctl restart nginx
systemctl enable nginx

# 3. Gera o SSL (Cadeado) - RESPONDA SEU E-MAIL QUANDO PEDIR
certbot --nginx -d leotv.fun -d www.leotv.fun
```

---

### 📡 4. Manual do Mestre: Integrando Sinais Externos (Vivensis)

**A) A Lógica do Hardware:**
- **1 Receptor Vivensis + 1 Encoder = 1 Canal por vez.**
- O link gerado mostrará exatamente o canal que estiver selecionado no controle remoto da Vivensis.
- Para oferecer 80 canais independentes ao mesmo tempo, seria necessário um rack profissional de receptores.

**B) Funcionamento e Manutenção:**
- **Energia:** O kit Vivensis + Encoder deve ficar ligado 24h por dia. Se desligar, o sinal no seu painel cai.
- **Internet:** O Encoder precisa de um cabo de rede ligado ao seu roteador para "enviar" o vídeo para o seu site Léo TV.
- **Bloqueio por PIN:** Uma vez que o link do Encoder está no seu painel, você tem controle total. Se o PIN do cliente vencer, o acesso ao sinal da Vivensis é cortado automaticamente pelo sistema.

**C) Grade de Canais:**
- Foca em canais abertos regionais (Globo, SBT, Record, Band) via satélite Sat HD Regional. Zero delay e imagem HD pura.

---
**SEU LINK DE ACESSO:** `https://leotv.fun`
