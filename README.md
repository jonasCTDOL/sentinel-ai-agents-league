# 🛡️ Sentinel AI

Agente Inteligente de Análise de Ocorrências orientado à segurança pública.

O sistema analisa descrições de ocorrências e gera, em tempo real, uma avaliação estruturada com classificação de risco, ações recomendadas e justificativa técnica.

---

## 🚀 Funcionalidades

- Análise de ocorrências em linguagem natural
- Classificação de risco (Baixo, Médio, Alto, Altíssimo)
- Definição de ações com escalonamento progressivo
- Justificativa técnica das decisões
- Interface visual interativa
- Suporte multi-IA:
  - Google Gemini
  - Microsoft Azure OpenAI

---

## 🧠 Arquitetura

Frontend (HTML + CSS + JavaScript)  
↓  
Backend (Node.js + Express)  
↓  
Integração com IA  
→ Google Gemini  
→ Azure OpenAI  

---

## ⚙️ Tecnologias Utilizadas

- Node.js
- Express
- JavaScript
- HTML5
- CSS3
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
│   ├── style.css  
│   └── script.js  
├── .env  
├── .gitignore  
├── package.json  
└── README.md  

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

GEMINI_KEY=sua_chave_gemini  
AZURE_KEY=sua_chave_azure  

Nunca compartilhe suas chaves em repositórios públicos.

---

## ▶️ Como Executar

### Backend

cd backend  
npm install  
node server.js  

Servidor disponível em:  
http://localhost:3000  

---

### Frontend

Abra o arquivo:

frontend/index.html  

Ou utilize Live Server.

---

## 🧪 Exemplo de Uso

Entrada:

suspeitos armados em mercado  

Saída esperada:

{
  "tipo": "Ocorrência com suspeitos armados",
  "risco": "Alto",
  "acoes": [
    "Avaliação inicial da situação",
    "Presença policial preventiva",
    "Isolamento do ambiente",
    "Negociação",
    "Acionamento de unidades especializadas"
  ],
  "justificativa": "A presença de suspeitos armados representa risco elevado à população e exige resposta escalonada."
}

---

## 🎯 Diferenciais

- Estrutura de decisão baseada em escalonamento
- Padronização em JSON estruturado
- Interface clara e funcional
- Integração com múltiplos modelos de IA
- Foco em aplicação real em segurança pública

---

## 📌 Aplicações

- Centros de comando e controle
- Atendimento emergencial
- Apoio à decisão policial
- Simulações e treinamento
- Análise estruturada de ocorrências

---

## 🏆 Status do Projeto

- Funcional
- Integrado com IA
- Pronto para demonstração
- Estruturado para evolução

---

## 👨‍💻 Autor

Jonas Henrique Spindler

---

## 🚀 Melhorias Futuras

- Dashboard com métricas
- Histórico de ocorrências
- Integração com mapas
- Versão mobile
- Deploy em nuvem

---

## 📄 Licença

Projeto desenvolvido para fins educacionais e experimentais.