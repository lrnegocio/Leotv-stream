
# Léo TV Stream - O Sistema Master (Edição Soberana leotv.fun)

### 🚀 STATUS DO SISTEMA: ONLINE v385-S
**IP DA VPS:** `177.153.202.104`
**DOMÍNIO:** `https://leotv.fun`
**PIN MESTRE:** `ADM77X2P`

---

### 📡 INTEGRAÇÃO DE HARDWARE (COAXIAL / DECODER)
Para usar seu sistema antigo de cabo no streaming, siga este esquema:

1. **Equipamento Necessário:** Compre um **Encoder HDMI (IP Encoder)**.
2. **Conexão:** 
   - Cabo Coaxial -> Decoder (Sky/Vivensis).
   - HDMI do Decoder -> Entrada do Encoder HDMI.
   - Cabo de Rede -> No Encoder e no seu roteador.
3. **Link de Sinal:** O Encoder vai te dar um link (ex: `http://192.168.x.x/live`).
4. **Painel Léo TV:** Adicione esse link como um "Canal ao Vivo" no seu painel.
5. **Vantagem:** O sistema tunela o sinal da sua casa pela VPS. O cliente assiste o sinal do seu cabo, mas o app protege seu IP residencial.

---

### 🛠️ Comandos de Manutenção (No Putty):

Para atualizar o sistema com novas melhorias:
```bash
cd ~/leotv
git fetch origin main
git reset --hard origin/main
chmod +x deploy.sh
./deploy.sh
```

---
**SINAL CALIBRADO PELO APP PROTOTYPER**
