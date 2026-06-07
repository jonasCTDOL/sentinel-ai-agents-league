# 🌐 Sentinel AI — Deploy no Render (Guia Completo)

Este guia explica como publicar o Sentinel AI na internet usando Render com Docker, entregando frontend e backend no mesmo link.

---

## 🎯 Objetivo

Publicar o sistema completo com:

- Backend Node.js
- Integração com IA (Gemini e Azure)
- Frontend integrado
- Execução via Docker
- Acesso público via navegador

---

## ✅ Pré-requisitos

Você precisa ter:

- Conta no GitHub
- Conta no Render (https://render.com)
- Projeto já no GitHub
- Dockerfile no projeto
- Backend funcionando localmente
- Chaves de API válidas

---

## 📁 Estrutura do Projeto

sentinel-ai-agents-league/
├── backend/
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── Dockerfile
├── docker-compose.yml
├── package.json
├── .env (apenas local)
└── README.md

---

## ⚙️ Configuração do Backend

### Porta dinâmica (obrigatório)

Use no server.js:

const PORT = process.env.PORT || 3000;

---

### Servir frontend pelo backend

No server.js:

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

---

## 🔐 Variáveis de Ambiente

No Render não use `.env`.

Configure direto na plataforma:

GEMINI_KEY=sua_chave_gemini
AZURE_KEY=sua_chave_azure

---

## 🚀 Passo a Passo do Deploy

1. Acesse:
https://dashboard.render.com

2. Clique em:
New → Web Service

3. Conecte o GitHub:
Autorize e selecione o repositório

4. Configure:

Name: sentinel-ai-agents-league  
Environment: Docker  
Branch: main  
Region: padrão  
Root Directory: deixar vazio  

5. Adicione variáveis:

GEMINI_KEY  
AZURE_KEY  

6. Clique:
Create Web Service

---

## ⚙️ Processo de Deploy

O Render irá:

- Clonar o repositório
- Executar o Dockerfile
- Instalar dependências
- Subir o servidor
- Disponibilizar o link público

---

## ✅ Verificação

Acesse:

https://seu-projeto.onrender.com

---

## ✅ Resultado esperado

- Interface carregando
- Campo de texto
- Seletor de IA
- Botão "Analisar"
- Resultado exibido

---

## 🧪 Teste da API

Endpoint:

POST /analisar

Exemplo:

{
  "texto": "suspeitos armados em escola",
  "modelo": "gemini"
}

---

## ⚠️ Observações

- /analisar aceita apenas POST
- GET mostrará "Cannot GET", o que é normal
- o Render pode "acordar" o serviço após inatividade

---

## 🔄 Atualizações

Após mudanças:

git add .
git commit -m "update"
git push

O deploy será automático.

---

## 🏆 Resultado Final

Você terá:

- Sistema online
- Backend funcionando
- Frontend integrado
- API pública
- Deploy com Docker
- Execução em nuvem

---

## 🎯 Conclusão

O Sentinel AI está publicado como aplicação completa, pronta para uso, demonstração e evolução.

---

## 👨‍💻 Autor

Jonas Henrique Spindler