
# Léo TV Stream - O Sistema Master (Edição VPS AlmaLinux 9)

### 🛠️ 1. Desbloqueio Total (No Putty):
Copie e cole estes comandos um por um para abrir o Firewall e desligar o bloqueio SELinux:
```bash
# Abre a porta 80 e 443
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload

# DESLIGA O SELINUX (O bloqueador invisível)
setenforce 0
sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config
```

### 📦 2. Atualização e Ativação do Sistema:
Sempre que fizer mudanças, salve no GitHub e rode isso no Putty:
```bash
# Entre na pasta do projeto
cd ~/leotv

# Dê permissão e rode o deploy Master
chmod +x deploy.sh
./deploy.sh
```

---
**SEU LINK DE ACESSO:** `http://24.152.37.78`
