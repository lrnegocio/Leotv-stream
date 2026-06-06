
# Léo TV Stream - O Sistema Master (Edição Soberana leotv.fun)

### 🚀 STATUS DO SISTEMA: ONLINE v385-S
**IP DA VPS:** `177.153.202.104`
**DOMÍNIO:** `https://leotv.fun`
**PIN MESTRE:** `ADM77X2P`

---

### 🛠️ 1. Comandos de Manutenção (No Putty):

Para atualizar o sistema com novas melhorias que fizermos no Studio:
```bash
cd ~/leotv
git fetch origin main
git reset --hard origin/main
./deploy.sh
```

### 📡 2. Inteligência de Sinais v385-S

**A) Sinais de Hardware (Sky/Vivensis):**
- **O que é:** Seu Encoder HDMI ligado em casa.
- **Segurança:** O sistema detecta IPs como `192.168...` ou `177...` e os tunela pela VPS. 
- **Vantagem:** O cliente assiste o sinal da sua casa, mas a VPS esconde a sua localização. **O link é vitalício.**

**B) Túnel Ghost (tvacabo.top / shortflix):**
- **O que faz:** Mascara o User-Agent do seu app.
- **Resultado:** Os sites acham que seu app é uma Smart TV autorizada. O erro de "Acesso Negado" foi exterminado.

---

### 🛡️ 3. Regras de Ouro (O que EVITAR no Putty):
1. **NUNCA** use `pm2 stop all` (Isso pode derrubar o seu Wireguard se ele estiver no PM2). Use sempre `pm2 restart leotv-master`.
2. **NUNCA** limpe o Firewall (`iptables -F`) sem saber, ou você perderá o acesso ao SSH e ao Wireguard.
3. **MANTENHA** o Node.js na versão 22 (já instalamos).

---
**SINAL CALIBRADO PELO APP PROTOTYPER**
