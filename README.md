
# Léo TV Stream - O Sistema Master (Edição Domínio leotv.fun)
                                                            
### 🛠️ 1. Desbloqueio Total (No Putty):
Copie e cole estes comandos um por um para abrir o Firewall:
```bash
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload
```

### 📦 2. Atualização e Ativação do Sistema (Sincronização v385):
```bash
cd ~/leotv
git fetch origin main
git reset --hard origin/main
chmod +x deploy.sh
./deploy.sh
```

---

### 📡 3. Inteligência de Sinais: Permanente vs Temporário

**A) Sinais de IPTV (Servidores Externos):**
- **O que são:** Sinais alugados (Ex: `172.110...`).
- **Validade:** São vinculados a uma conta. Quando o acesso vence no servidor deles, o sinal para. 
- **O Segredo:** Não existe link vitalício em servidores de terceiros. Se você não é o dono do servidor, você depende do pagamento da conta.

**B) Sinais de Hardware (O Único Vitalício):**
- **O que é:** 1 Receptor Sky/Vivensis + 1 Encoder HDMI ligados na SUA rede.
- **Vantagem:** O sinal sai da antena direto para o seu site. **Nunca expira**, não tem mensalidade de servidor e o link é seu para sempre.
- **Como integrar:** Pegue o IP do seu Encoder e cole no painel Léo TV. O nosso **Túnel Ghost** na VPS vai proteger o seu IP de casa e entregar o sinal para os seus clientes.

---

### 🧠 4. Protocolo de Captura (O Manual do Mestre)

1.  **Deep-Trace**: Nosso sistema agora segue redirecionamentos ocultos para achar a CDN final do vídeo automaticamente.
2.  **Mascara TV**: O `tvacabo.top` e o `shortflix.net` são abertos em um frame que remove anúncios e injeta CSS de limpeza.
3.  **Bypass de Hardware**: Sinais vindo de Encoders residenciais são tunelados pela VPS para garantir segurança e anonimato.

---
**SEU LINK DE ACESSO:** `https://leotv.fun`
