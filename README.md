# 🛡️ Sentinel AI

> From raw incident description to structured operational decision support — in seconds.

Sistema inteligente de análise de ocorrências que transforma linguagem natural em decisões operacionais estruturadas, utilizando múltiplos modelos de Inteligência Artificial.

---

## 🌐 Acesso Online

A aplicação já está disponível publicamente:

https://sentinel-ai-agents-league.onrender.com

---

## 🎯 Visão Geral

O Sentinel AI é um agente inteligente capaz de interpretar ocorrências textuais e gerar, em tempo real:

- Classificação de risco
- Ações recomendadas
- Justificativa técnica estruturada
- Respostas padronizadas em JSON

O sistema atua como um **apoio à decisão**, não apenas como um gerador de respostas.

---

## 🚀 Funcionalidades

- Entrada de ocorrências em linguagem natural
- Classificação automática de risco (Baixo, Médio, Alto, Altíssimo)
- Geração de ações com escalonamento progressivo
- Justificativa baseada em análise contextual
- Interface visual interativa
- Integração com múltiplos modelos de IA:
  - Google Gemini
  - Microsoft Azure OpenAI
- Execução em tempo real
- Retorno estruturado em JSON

---

## 🧠 Arquitetura

Frontend (HTML + CSS + JavaScript)  
↓  
Backend (Node.js + Express)  
↓  
Integração com IA  
→ Google Gemini  
→ Azure OpenAI  
↓  
Containerização  
→ Docker  
↓  
Deploy  
→ Render (Cloud)

---

## ⚙️ Tecnologias Utilizadas

- Node.js
- Express
- JavaScript
- HTML5
- CSS3
- Docker
- Google Gemini API
- Azure OpenAI
- Dotenv

---

## 📦 Estrutura do Projeto

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

## 🔐 Variáveis de Ambiente

Arquivo `.env` local:

GEMINI_KEY=sua_chave_gemini  
AZURE_KEY=sua_chave_azure  

⚠️ Nunca versionar esse arquivo.

No ambiente de produção (Render), as variáveis são configuradas diretamente no painel.

---

## ▶️ Execução Local

### Backend

cd backend  
npm install  
node server.js  

Servidor:

http://localhost:3000  

---

### Frontend

Abrir diretamente:

frontend/index.html  

ou usar Live Server.

---

## 🐳 Execução com Docker

docker-compose up --build  

---

## 🧪 Exemplo de Uso

Entrada:

suspeitos armados em escola  

Saída:

{
  "tipo": "Ocorrência com suspeitos armados",
  "risco": "Alto",
  "acoes": [
    "Avaliação inicial",
    "Presença preventiva",
    "Isolamento do local",
    "Negociação",
    "Acionamento de unidades especializadas"
  ],
  "justificativa": "Risco elevado à vida exige resposta escalonada e controlada."
}

---

## 🎯 Diferenciais

- Transformação de texto em decisão operacional
- Estrutura de escalonamento progressivo
- Resposta padronizada e reutilizável (JSON)
- Multi-model AI (resiliência e flexibilidade)
- Arquitetura completa (frontend + backend + cloud)
- Deploy real em ambiente de produção

---

## 📌 Aplicações

- Centros de comando e controle
- Segurança pública
- Atendimento emergencial
- Treinamento e simulações
- Sistemas de apoio à decisão

---

## 🏆 Status do Projeto

- Funcional
- Online
- Integrado com IA
- Containerizado com Docker
- Deploy em nuvem concluído
- Pronto para demonstração

---

## 🚀 Roadmap

- Dashboard com métricas
- Histórico de ocorrências
- Geolocalização
- Interface mobile
- API pública documentada
- Comparação entre modelos de IA

---

## 👨‍💻 Autor

Jonas Henrique Spindler

---

## 💥 Destaque

The system does not automate force — it supports responsible, structured decision-making.
``