// ==============================================================================
// 1. CARREGAMENTO DE VARIÁVEIS DE AMBIENTE
// ==============================================================================
require("dotenv").config();

// ==============================================================================
// 2. IMPORTAÇÕES
// ==============================================================================
const express = require("express");
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");

// ==============================================================================
// 3. CONFIGURAÇÃO DO SERVIDOR
// ==============================================================================
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// ==============================================================================
// 4. CONFIGURAÇÃO DE CHAVES E ENDPOINTS
// ==============================================================================
const GEMINI_KEY = process.env.GEMINI_KEY;
const AZURE_KEY = process.env.AZURE_KEY;

const AZURE_ENDPOINT = "https://sentinel-ai-jonas-01-resource.openai.azure.com";
const AZURE_DEPLOYMENT = "gpt-oss-120b";

// ==============================================================================
// 5. PROMPT AVANÇADO (AGENTE MULTI-AGENTE)
// ==============================================================================
const SYSTEM_PROMPT = `
Você é um sistema multi-agente de inteligência e tomada de decisão em segurança pública.

Você opera em três etapas:
1. Planejamento
2. Análise
3. Decisão

Para cada ocorrência:
- identifique tipo
- avalie risco (Baixo, Médio, Alto, Altíssimo)
- defina ações com escalonamento progressivo
- produza justificativa estruturada

ESCALONAMENTO:
1. Avaliação inicial
2. Presença preventiva
3. Isolamento
4. Negociação
5. Unidades especializadas (somente se necessário)

RESTRIÇÕES:
- NÃO usar nomes de unidades específicas (PM, BOPE, etc.)
- NÃO usar linguagem militarizada
- NÃO iniciar com ação tática
- NÃO sugerir força letal como primeira opção
- NÃO pular etapas

REQUISITO CRÍTICO DE JUSTIFICATIVA:

A justificativa DEVE seguir EXATAMENTE esta estrutura:

"A compreensão inicial identifica [...]. A análise contextual indica [...]. Com base nessa avaliação progressiva, a decisão [...]"

Se não seguir essa estrutura, a resposta é inválida.

FORMATO (OBRIGATÓRIO - JSON):

{
  "tipo": "",
  "risco": "",
  "acoes": [],
  "justificativa": ""
}
`;

// ==============================================================================
// 6. ROTA FRONTEND
// ==============================================================================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ==============================================================================
// 7. ROTA PRINCIPAL DA API
// ==============================================================================
app.post("/analisar", async (req, res) => {
  const { texto, modelo } = req.body;

  // ======================================
  // VALIDAÇÃO INICIAL
  // ======================================
  if (!texto || !modelo) {
    return res.status(400).json({
      erro: "Texto ou modelo não informado."
    });
  }

  if (!GEMINI_KEY || !AZURE_KEY) {
    return res.status(500).json({
      erro: "Chaves de API ausentes no servidor."
    });
  }

  try {
    let resultado = "";

    // =====================================================================
    // 8. CHAMADA GEMINI
    // =====================================================================
    if (modelo === "gemini") {

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${SYSTEM_PROMPT}\n\nOCORRÊNCIA: ${texto}`
                  }
                ]
              }
            ]
          })
        }
      );

      if (!response.ok) {
        console.error("❌ Erro Gemini:", response.status);
        return res.status(500).json({ erro: "Falha na API Gemini." });
      }

      const data = await response.json();
      resultado = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    // =====================================================================
    // 9. CHAMADA AZURE (CORRIGIDA)
    // =====================================================================
    else if (modelo === "azure") {

      const response = await fetch(
        `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": AZURE_KEY
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: SYSTEM_PROMPT
              },
              {
                role: "user",
                content: texto
              }
            ],
            temperature: 0.2 // 🔥 Reduz variação → melhora consistência
          })
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("❌ Erro Azure:", response.status);
        console.error("❌ Detalhes:", errorBody);

        return res.status(500).json({
          erro: "Falha na API Azure"
        });
      }

      const data = await response.json();
      resultado = data?.choices?.[0]?.message?.content;
    }

    else {
      return res.status(400).json({
        erro: "Modelo inválido."
      });
    }

    // =====================================================================
    // 10. PARSER JSON (CRÍTICO)
    // =====================================================================
    try {
      const resultadoObjeto =
        typeof resultado === "string"
          ? JSON.parse(resultado)
          : resultado;

      res.json({ result: resultadoObjeto });

    } catch (parseErro) {
      console.error("❌ Erro ao converter JSON:", parseErro);

      res.json({
        fallback_text: resultado,
        erro: "Resposta não veio em JSON válido"
      });
    }

  } catch (erro) {
    console.error("🔥 Erro interno:", erro);

    res.status(500).json({
      erro: "Erro interno do servidor."
    });
  }
});

// ==============================================================================
// 11. INICIALIZAÇÃO DO SERVIDOR
// ==============================================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Sentinel rodando na porta ${PORT}`);
});
