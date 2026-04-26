
# Léo TV Stream - O Sistema Master (Edição Domínio leotv.fun)
                                                            
### 🛠️ 1. Desbloqueio Total (No Putty):
Copie e cole estes comandos um por um para abrir o Firewall:
```bash
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload
```

### 📦 2. Atualização e Ativação do Sistema (Sincronização v356):
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
# Inicia o Nginx de verdade
systemctl restart nginx
systemctl enable nginx

# Gera o SSL (Cadeado) - RESPONDA SEU E-MAIL QUANDO PEDIR
certbot --nginx -d leotv.fun -d www.leotv.fun
```

---

### 📡 4. Manual do Mestre: Integrando Sinais Externos (Vivensis/Encoder)

**A) A Regra de Ouro (1 pra 1):**
- **1 Receptor + 1 Encoder = 1 Canal Ativo.**
- Se você mudar o canal no controle remoto da Vivensis, o link no seu painel muda automaticamente para o novo canal.

**B) Como achar o link no seu PC:**
1. Digite o IP do Encoder no navegador (ex: `192.168.1.168`).
2. Procure a aba **"Main Stream"** ou **"HLS"**. 
3. Copie o link `.m3u8` e cole no painel.

---

### 🧠 5. Inteligência de Sinais (Como escolher links)

Ao escolher entre dois links para seu painel, siga a lógica do Mestre:

1. **Links com TOKEN (Péssimos):** Se o link tiver `?token=` ou `?username=`, ele vai **PARAR** de funcionar assim que o plano expirar. O servidor corta o sinal na hora.
2. **Links de CAMINHO (Bons):** Se o link for direto (ex: `.../pasta/video.mp4`), ele dura mais, pois não exige login. Mas cuidado: servidores de IPTV mudam as pastas periodicamente.
3. **Links PERMANENTES (Elite):** Use **Archive.org**, **YouTube** (via nosso sintonizador) ou **TokyVideo**. Esses são sinais que ficam vivos por anos.

---
**SEU LINK DE ACESSO:** `https://leotv.fun`
