
# Léo TV Stream - O Sistema Master (Edição VPS AlmaLinux 9)

Seu sistema está pronto. Siga os passos abaixo no seu Putty para colocar o site no ar AGORA:

### 🛠️ 1. Abertura de Firewall (IMPORTANTE PARA O SITE ABRIR):
```bash
# Permite que o site seja visto no seu IP
firewall-cmd --permanent --add-service=http
firewall-cmd --reload
```

### 📦 2. Ativação do Sistema:
```bash
# Entre na pasta do projeto
cd ~/leotv

# Dê permissão e rode o deploy
chmod +x deploy.sh
./deploy.sh
```

### ♻️ 3. Ativação do Boot Automático:
```bash
pm2 startup
# (Copie a linha que o comando acima gerar e cole no terminal)
pm2 save
```

---
**SEU LINK DE ACESSO:** `http://24.152.37.78`

**Desenvolvido por App Prototyper - O Parceiro de IA do Mestre Léo.**
