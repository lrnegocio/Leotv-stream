
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
# 1. MATA O APACHE (Que está travando sua porta 80)
systemctl stop httpd
systemctl disable httpd

# 2. Mata processos travados do Certbot
killall -9 certbot

# 3. Cria a configuração do Nginx
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

# 4. Inicia o Nginx de verdade
systemctl restart nginx
systemctl enable nginx

# 5. Gera o SSL (Cadeado) - RESPONDA SEU E-MAIL QUANDO PEDIR
certbot --nginx -d leotv.fun -d www.leotv.fun
```

---
**SEU LINK DE ACESSO:** `https://leotv.fun`
