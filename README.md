
# Léo TV Stream - O Sistema Master (Edição Domínio leotv.fun)
                                                            
### 🛠️ 1. Desbloqueio Total (No Putty):
Copie e cole estes comandos um por um para abrir o Firewall:
```bash
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload
```

### 📦 2. Atualização e Ativação do Sistema (Sincronização v370):
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
systemctl restart nginx
systemctl enable nginx
certbot --nginx -d leotv.fun -d www.leotv.fun
```

---

### 📡 4. Inteligência de Sinais: Permanente vs Temporário

**A) Sinais de IPTV (Servidores Externos):**
- **O que são:** Sinais alugados (Ex: `172.110...`).
- **Validade:** São vinculados a uma conta. Quando o acesso vence no servidor deles, o sinal para. 
- **O Segredo:** Não existe link vitalício em servidores de terceiros. Se você não é o dono do servidor, você depende do pagamento da conta.

**B) Sinais de Hardware (O Único Vitalício):**
- **O que é:** 1 Receptor Vivensis + 1 Encoder ligados na SUA rede.
- **Vantagem:** O sinal sai da antena direto para o seu site. **Nunca expira**, não tem mensalidade de servidor e o link é seu para sempre.
- **Como integrar:** Pegue o IP do seu Encoder e cole no painel Léo TV.

---

### 🧠 5. Protocolo de Captura (O Manual do Mestre)

1. **Swap Gênio:** Se o link terminar em `.ts`, o sistema converte para `.m3u8` para economizar banda e evitar bloqueios.
2. **Deep-Trace:** Nosso sistema agora segue redirecionamentos ocultos para tentar achar a CDN final do vídeo.
3. **Limpeza Profunda:** Anúncios e interfaces de sites (Roblox, Mercado Play) são removidos por injeção de CSS.

---
**SEU LINK DE ACESSO:** `https://leotv.fun`
