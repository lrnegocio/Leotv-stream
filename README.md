
# Léo TV Stream - O Sistema Master (Edição VPS AlmaLinux 9)

Seu sistema está pronto para ser injetado na sua VPS. Siga os passos abaixo no seu Putty:

### 🚀 1. Preparação do Terreno (Copie e cole um por um):

```bash
# Atualize os pacotes do sistema
dnf update -y

# Habilite o Node.js 20
dnf module enable nodejs:20 -y

# Instale o motor e as ferramentas
dnf install -y nodejs npm git

# Instale o Vigilante Soberano (PM2)
npm install -g pm2
```

### 📦 2. Clonagem e Instalação (Injeção do Código):

```bash
# Vá para a pasta principal de aplicativos
cd /var/www || cd ~

# Clone o seu repositório oficial
git clone https://github.com/lrnegocio/Leotv-stream.git leotv
cd leotv

# Dê permissão ao script de atualização e execute
chmod +x deploy.sh
./deploy.sh
```

### ♻️ 3. Ativação do Boot Automático:
```bash
# Configure para o sistema ligar sozinho se a VPS reiniciar
pm2 startup
# (IMPORTANTE: O comando acima vai gerar uma linha de código no terminal. Copie essa linha e cole ela no terminal para confirmar)
pm2 save
```

### 🏗️ Como atualizar o sistema futuramente:
Sempre que fizer mudanças aqui no Firebase Studio e der `git push`, vá no Putty e digite:
```bash
cd ~/leotv || cd /var/www/leotv
./deploy.sh
```

---
**Desenvolvido por App Prototyper - O Parceiro de IA do Mestre Léo.**
