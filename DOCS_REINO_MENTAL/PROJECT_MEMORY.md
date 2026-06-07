# 🧠 Sentinel AI — Project Memory (Versão Final)

Registro completo da evolução, decisões técnicas e maturidade do projeto Sentinel AI.

---

## 🎯 Objetivo do Projeto

Desenvolver um agente inteligente capaz de analisar ocorrências em linguagem natural e gerar respostas estruturadas para apoio à decisão em segurança pública.

O sistema realiza:

- Interpretação de contexto
- Classificação de nível de risco
- Geração de ações operacionais
- Justificativa técnica estruturada
- Retorno em JSON padronizado

---

## 🧠 Conceito Central

O Sentinel AI evoluiu para um sistema de:

→ Apoio à decisão operacional  
→ Inteligência estruturada em tempo real  
→ Transformação de texto em ação estratégica  

---

## 🏗️ Arquitetura Final

Frontend (HTML + CSS + JS)  
↓  
Backend (Node.js + Express)  
↓  
Integração Multi‑IA  
→ Google Gemini  
→ Azure OpenAI  

↓  
Containerização  
→ Docker  

---

## 🔥 Evolução do Projeto

### ✅ Fase 1 — Protótipo
- Interface básica
- Entrada de texto
- Integração com Gemini

---

### ✅ Fase 2 — Estruturação
- Definição de JSON padronizado
- Campos:
  - tipo
  - risco
  - ações
  - justificativa

---

### ✅ Fase 3 — Inteligência Operacional
- Introdução de escalonamento progressivo
- Princípios:
  - proporcionalidade
  - proteção da vida
  - redução de risco

---

### ✅ Fase 4 — Integração Azure
- Configuração de endpoint
- Uso do modelo:
  gpt-oss-120b
- Correção de erros:
  - DeploymentNotFound
  - API Key inválida

---

### ✅ Fase 5 — Multi-IA
- Alternância entre modelos:
  - Gemini
  - Azure
- Backend unificado

---

### ✅ Fase 6 — Padronização de Resposta
- Forçar JSON no Gemini
- Forçar JSON no Azure
- Garantia de compatibilidade frontend

---

### ✅ Fase 7 — Interface Profissional
- JSON → UI visual
- Implementação de:
  - cartões (cards)
  - listas de ações
  - cores de risco

---

### ✅ Fase 8 — Correções Críticas
- JSON inválido
- resposta Azure inconsistente (objeto vs string)
- ajuste de renderização

---

### ✅ Fase 9 — Segurança
- Remoção de API Keys do código
- Uso de `.env`
- Bloqueio do GitHub resolvido
- Boas práticas aplicadas

---

### ✅ Fase 10 — Estrutura do Projeto

Separação: