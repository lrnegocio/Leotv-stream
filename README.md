
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

### 📡 4. Manual do Mestre: Integrando Receptores de Satélite (Vivensis, etc.)
Você pode usar aparelhos físicos para alimentar sua grade de canais com sinal 100% estável:

1.  **EQUIPAMENTO:** Você precisará de um **IPTV Encoder HDMI** (dispositivo que transforma HDMI em link de internet).
2.  **CONEXÃO:** Ligue o cabo HDMI do receptor (como o Vivensis Vx10) na entrada do Encoder.
3.  **GERAÇÃO DE LINK:** O Encoder fornecerá um link no formato `http://seu-ip:porta/stream.m3u8`.
4.  **CADASTRO:** Vá no seu **Painel Admin -> Novo Conteúdo**, cole esse link e selecione a categoria **LÉO TV AO VIVO**.
5.  **CONTROLE:** Agora esse canal está sob seu domínio! Você pode bloquear, restringir por senha ou liberar apenas para clientes VIPs.

---
**SEU LINK DE ACESSO:** `https://leotv.fun`
