
# Léo TV Stream - O Sistema Master (Edição VPS AlmaLinux 9)

Seu sistema está pronto para ser injetado na sua VPS. Siga os passos abaixo no seu Putty para corrigir o erro de 'npm não encontrado':

### 🛠️ 1. Correção da Instalação (Copie e cole no Putty):

```bash
# Mate processos travados do instalador
rm -f /var/run/dnf.pid

# Reinstale o Node.js e NPM de forma limpa
dnf clean all
dnf install -y nodejs npm git

# Instale o Vigilante Soberano (PM2) globalmente
npm install -g pm2
```

### 📦 2. Atualização e Injeção do Código:

```bash
# Entre na pasta do projeto que você já clonou
cd ~/leotv

# Dê permissão e rode o novo deploy
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
