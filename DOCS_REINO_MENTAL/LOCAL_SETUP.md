# 🛠️ Sentinel AI — Manual de Execução Local

Este guia explica como configurar e executar o projeto Sentinel AI localmente, passo a passo.

---

## 📌 Pré-requisitos

Certifique-se de ter instalado:

- Node.js (versão 18 ou superior)
- Git
- Docker Desktop (opcional)
- VS Code (recomendado)

---

## 📁 Estrutura do Projeto

sentinel-ai-agents-league/
├── backend/
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── .env
├── Dockerfile
├── docker-compose.yml
└── README.md

---

## 🔐 Configuração do .env

Na raiz do projeto, crie o arquivo `.env` com:

GEMINI_KEY=sua_chave_gemini
AZURE_KEY=sua_chave_azure

⚠️ Não use aspas  
⚠️ Não publique esse arquivo  

---

## ▶️ Execução com Node.js

### 1. Acesse o backend

cd backend

---

### 2. Instale as dependências

npm install

---

### 3. Inicie o servidor

node server.js

---

### 4. Resultado esperado

Você verá no terminal:

🚀 Servidor rodando em http://localhost:3000

---

### 5. Teste rápido

Abra no navegador:

http://localhost:3000

Mensagem esperada:

Cannot GET /

✅ Isso indica que o backend está funcionando.

---

## 🌐 Executando o Frontend

### 1. Abra o arquivo

frontend/index.html

---

### 2. Executar

- Duplo clique OU  
- Usar Live Server no VS Code

---

### 3. Testar o sistema

Digite uma ocorrência:

ex: suspeitos armados em escola

Selecione:

- gemini
- azure

Clique:

Analisar

---

### ✅ Resultado esperado

O sistema deve mostrar:

- Tipo
- Risco
- Ações
- Justificativa

---

## 🐳 Execução com Docker

### 1. Verificar Docker

docker --version

---

### 2. Rodar container

docker-compose up --build

---

### 3. Aguardar

Na primeira execução o Docker vai:

- baixar imagem
- instalar dependências
- subir servidor

---

### 4. Confirmação

Você verá:

🚀 Servidor rodando em http://localhost:3000

---

### 5. Testar

Abra:

http://localhost:3000

Resultado esperado:

Cannot GET /

---

### 6. Usar frontend

Abra:

frontend/index.html

---

### 7. Parar container

docker-compose down

---

## 🔄 Atualizar alterações

Sempre que mudar o código:

docker-compose up --build

---

## ⚠️ Problemas comuns

### API key inválida

Verifique:
- arquivo .env
- chaves corretas
- dotenv carregado

---

### Docker não funciona

Solução:
- abrir Docker Desktop

---

### Frontend não responde

Verifique:
- backend rodando
- porta 3000 ativa

---

## ✅ Verificação final

Tudo está funcionando quando:

- backend responde
- frontend envia requisição
- resultado aparece estruturado

---

## 🏁 Conclusão

O sistema Sentinel AI está:

✅ Funcionando localmente  
✅ Integrado com IA  
✅ Pronto para uso ou demo  

---

## 👨‍💻 Autor

Jonas Henrique Spindler
``