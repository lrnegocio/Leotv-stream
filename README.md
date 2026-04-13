
# Léo TV Stream - O Sistema Master (Edição VPS AlmaLinux 9)

Seu sistema está operando na VPS. Se o site não abrir, siga os passos abaixo no seu painel da **Master da Web** (conforme a imagem que você mandou):

### 🌐 1. Configuração de Firewall Externo (No site da Master da Web):
1. No seu painel de Firewalls, clique em **Editar** no "Firewall LeoTV".
2. Vá na aba **Máquinas Virtuais** e clique em **Vincular**. Escolha o seu IP `24.152.37.78`.
3. Vá na aba **Regras** e adicione uma regra de entrada:
   - **Protocolo**: TCP
   - **Porta**: 80
   - **Ação**: Aceitar (Accept)
4. Salve as mudanças.

### 🛠️ 2. Firewall Interno (No Putty):
Cole estes comandos um por um e dê Enter:
```bash
# Libera a porta 80 no sistema operacional
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-service=http
firewall-cmd --reload
```

### 📦 3. Atualização e Ativação do Sistema:
Sempre que fizer mudanças aqui no Firebase Studio, salve no GitHub e rode isso no Putty:
```bash
# Entre na pasta do projeto
cd ~/leotv

# Dê permissão e rode o deploy
chmod +x deploy.sh
./deploy.sh
```

---
**SEU LINK DE ACESSO:** `http://24.152.37.78`

**Desenvolvido por App Prototyper - O Parceiro de IA do Mestre Léo.**
