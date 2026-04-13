
# Léo TV Stream - O Sistema Master (Edição VPS AlmaLinux 9)

Seu sistema está quase online. Siga os passos abaixo no seu Putty para abrir o site para o mundo:

### 🛠️ 1. Abertura de Firewall (IMPORTANTE PARA O SITE ABRIR):
Cole estes comandos um por um e dê Enter:
```bash
# Permite tráfego na porta 80 (HTTP)
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-service=http
firewall-cmd --reload
```

### 📦 2. Atualização e Ativação do Sistema:
Sempre que fizer mudanças no Firebase Studio, rode isso no Putty:
```bash
# Entre na pasta do projeto
cd ~/leotv

# Dê permissão e rode o deploy (Ele agora limpa conflitos sozinho)
chmod +x deploy.sh
./deploy.sh
```

---
**SEU LINK DE ACESSO:** `http://24.152.37.78`

**Desenvolvido por App Prototyper - O Parceiro de IA do Mestre Léo.**
