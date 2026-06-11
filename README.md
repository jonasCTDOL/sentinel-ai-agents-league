# 🛡️ Sentinel AI - Multi-Agent Reasoning System for Public Safety

> Transforming natural language into structured, responsible, and explainable operational decisions using multi-agent reasoning.

---

## 🌐 Live Demo

🔗 https://sentinel-ai-agents-league.onrender.com

---

## 🎯 Problem Statement

Decision-making in public safety environments is complex, high-stakes, and time-critical.

Operators must:
- Interpret incomplete information  
- Evaluate risk dynamically  
- Act with proportionality  
- Preserve human life  
- Maintain institutional trust  

Traditional systems often:
- Oversimplify decisions  
- Skip reasoning steps  
- Lack explainability  

---

## ✅ Solution

Sentinel AI is a **multi-agent reasoning system** that transforms unstructured incident descriptions into:

- Structured risk classification  
- Progressive operational actions  
- Explainable decision logic  
- Standardized JSON outputs  

The system does NOT automate force.  
It enforces **responsible, structured, and auditable decision-making**.

---

## 🧠 Core Innovation: Multi-Agent Reasoning

The system simulates a reasoning pipeline:

1. Planning → understands the scenario  
2. Analysis → evaluates risk and context  
3. Decision → applies escalation and outputs actions  

This ensures **step-by-step reasoning instead of direct answers**.

---

## 🔄 Reasoning Flow

User Input  
↓  
Planning (Context Understanding)  
↓  
Analysis (Risk + Impact)  
↓  
Decision (Escalation + Actions)  
↓  
Structured JSON Output  

---

## 📦 Output Format (Strict JSON)

    {
      "tipo": "",
      "risco": "Baixo | Médio | Alto | Altíssimo",
      "acoes": [],
      "justificativa": ""
    }

---

## 🧠 Reasoning Constraints

The system enforces structured justification:

1. Situation understanding  
2. Risk and context analysis  
3. Progressive decision logic  

Expected pattern:

"A compreensão inicial identifica [...].  
A análise contextual indica [...].  
Com base nessa avaliação progressiva [...]"

---

## ⚙️ Operational Logic

Mandatory escalation model:

- Avaliação inicial  
- Presença preventiva  
- Isolamento  
- Negociação  
- Acionamento de unidades especializadas (somente se necessário)  

---

## 🔐 Responsible AI & Safety

Strict constraints:

- No immediate tactical escalation  
- No lethal force as first option  
- No specific unit names  
- No militarized language  

Focus:

- Protection of life  
- Harm reduction  
- De-escalation  
- Institutional legitimacy  

---

## ☁️ Microsoft Azure Integration

- Azure OpenAI deployed model  
- Compatible with Microsoft Foundry architecture  
- Agent-oriented reasoning design  
- Ready for future Foundry IQ integration  

---

## 🤖 Multi-Model Architecture

Supports:

- Azure OpenAI  
- Google Gemini  

Benefits:

- Redundancy  
- Flexibility  
- Model comparison  

---

## 🏗️ Architecture

Frontend (HTML + CSS + JS)  
↓  
Backend (Node.js + Express)  
↓  
AI Layer  
- Azure OpenAI  
- Google Gemini  
↓  
Processing Layer  
↓  
JSON Output  
↓  
Deploy (Docker + Render)  

---

## 🧪 Example

Input:

    Pessoa armada em surto em via pública

Output:

    {
      "tipo": "Pessoa armada em surto psicótico",
      "risco": "Alto",
      "acoes": [
        "Avaliação inicial",
        "Presença preventiva",
        "Isolamento",
        "Negociação",
        "Unidades especializadas em caso de agravamento"
      ],
      "justificativa": "A compreensão inicial identifica uma ocorrência com presença de arma e instabilidade comportamental. A análise contextual indica risco elevado de agravamento. Com base nessa avaliação progressiva, a decisão prioriza contenção, isolamento e negociação."
    }

---

## 📦 Project Structure

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
    └── README.md

---

## ⚙️ Environment Variables

    GEMINI_KEY=your_key
    AZURE_KEY=your_key

⚠️ Do not commit `.env`

---

## ▶️ Run Locally

    cd backend
    npm install
    node server.js

Frontend:

    frontend/index.html

---

## 🐳 Docker

    docker-compose up --build

---

## 🏆 Hackathon Alignment

- Multi-agent system ✅  
- Reasoning-based decisions ✅  
- Structured outputs ✅  
- Responsible AI ✅  
- Real-world application ✅  
- Microsoft ecosystem ✅  

---

## 🚀 Roadmap

- Observability dashboard  
- Evaluation metrics  
- Foundry IQ integration  
- Multi-agent orchestration  
- Real-time analytics  

---

## 📌 Use Cases

- Public safety centers  
- Emergency decision support  
- Training simulations  
- Risk analysis systems  

---

## 👨‍💻 Author

Jonas Henrique Spindler

---

## 💥 Final Statement

Sentinel AI does not replace human decision-making.  
It enhances it through structured reasoning, accountability, and safety.
