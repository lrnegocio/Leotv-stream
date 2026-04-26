
# Léo TV Stream - O Sistema Master (Edição Domínio leotv.fun)
                                                            
### 🛠️ 1. Desbloqueio Total (No Putty):
Copie e cole estes comandos um por um para abrir o Firewall:
```bash
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload
```

### 📦 2. Atualização e Ativação do Sistema (Sincronização v353):
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
- Se você mudar o canal no controle remoto da Vivensis, o link no seu painel muda automaticamente para o novo canal. O sinal anterior é substituído. Não existem "links permanentes para 80 canais" com apenas um aparelho.

**B) Como achar o link no seu PC:**
1. Conecte o Encoder no seu Roteador via cabo de rede.
2. No seu computador, abra o navegador e digite o IP do Encoder (ex: `192.168.1.168`). Esse IP vem no manual do aparelho.
3. Entre com o usuário e senha (geralmente `admin` / `admin`).
4. Procure a aba **"Main Stream"** ou **"HLS"**. 
5. Lá estará o seu link master (ex: `http://192.168.1.168:8080/live/stream.m3u8`).
6. **IMPORTANTE:** Para esse link funcionar na internet para seus clientes, você precisa fazer o "Redirecionamento de Portas" (Port Forwarding) no seu roteador para a porta 8080.

**C) Uso Recomendado:**
- Use o kit físico para garantir o canal MAIS IMPORTANTE da sua grade com 100% de estabilidade (Ex: Globo da sua cidade). Para os demais canais, continue usando os links de internet sintonizados pelo sistema.

---
**SEU LINK DE ACESSO:** `https://leotv.fun`
