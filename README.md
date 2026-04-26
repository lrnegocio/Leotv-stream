
# Léo TV Stream - O Sistema Master (Edição Domínio leotv.fun)
                                                            
### 🛠️ 1. Desbloqueio Total (No Putty):
Copie e cole estes comandos um por um para abrir o Firewall:
```bash
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload
```

### 📦 2. Atualização e Ativação do Sistema (Sincronização v352):
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

### 📡 4. Manual do Mestre: Integrando Sinais Externos

**A) Diferença entre Vivensis e Léo TV:**
- **Vivensis (Receptor):** Pega sinal da antena parabólica. Funciona SEM internet. Sistema FECHADO (Não roda o Léo TV dentro dele).
- **Léo TV (Seu Sistema):** Funciona COM internet. Sistema ABERTO (Roda em TV Box, Celular e PC).

**B) Como colocar o sinal da Vivensis no seu Painel:**
Para transformar o sinal da antena em um link que seu sistema aceite, você precisa de um **IPTV ENCODER HDMI**.

1. **EQUIPAMENTO:** Compre um "HDMI Video Encoder" (Mercado Livre/AliExpress).
2. **CONEXÃO:** 
   - Ligue a antena no Receptor Vivensis.
   - Ligue o cabo HDMI do Receptor na ENTRADA do Encoder.
   - Ligue o Encoder no seu roteador de internet.
3. **GERAÇÃO DE LINK:** O Encoder vai te dar um endereço (ex: `http://192.168.1.50/stream.m3u8`).
4. **CADASTRO MASTER:** No seu **Painel Admin**, adicione esse link.
5. **CONTROLE TOTAL:** Agora você pode cobrar mensalidade (PIN) para liberar esse sinal do satélite para seus clientes via internet!

---
**SEU LINK DE ACESSO:** `https://leotv.fun`
