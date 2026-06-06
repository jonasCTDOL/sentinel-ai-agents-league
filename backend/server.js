require('dotenv').config();
// ===============================
// IMPORTAÇÕES
// ===============================
const express = require("express");
const cors = require("cors");

// fetch compatível com Node
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));


// ===============================
// CONFIGURAÇÃO DO APP
// ===============================
const app = express();

app.use(cors());
app.use(express.json());


// ===============================
// CONFIGURAÇÕES DAS IAs
// ===============================

// 🔒 CHAVES SEGURAS (via .env)
const GEMINI_KEY = process.env.GEMINI_KEY;
const AZURE_KEY = process.env.AZURE_KEY;

// ✅ CONFIRMADAS
const AZURE_ENDPOINT = "https://sentinel-ai-jonas-01-resource.openai.azure.com";
const AZURE_DEPLOYMENT = "gpt-oss-120b";


// ===============================
// FUNÇÃO AUXILIAR (VALIDAR JSON)
// ===============================
function isJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}


// ===============================
// ROTA PRINCIPAL
// ===============================
app.post("/analisar", async (req, res) => {

  const { texto, modelo } = req.body;

  console.log("Texto:", texto);
  console.log("Modelo:", modelo);

  if (!texto) {
    return res.status(400).json({ erro: "Texto não informado" });
  }

  try {

    let resultado = "";

    // =========================
    // 🔵 GEMINI
    // =========================
    if (modelo === "gemini") {

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Responda SOMENTE em JSON:

{
  "tipo": "",
  "risco": "",
  "acoes": [],
  "justificativa": ""
}

OCORRÊNCIA: ${texto}`
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        }
      );

      const data = await response.json();

      console.log("Gemini:", data);

      resultado = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    // =========================
    // 🟣 AZURE
    // =========================
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
                content: `Você é um agente de segurança pública.

Responda SOMENTE em JSON com:
tipo, risco, acoes, justificativa.

Use análise proporcional e escalonamento.`
              },
              {
                role: "user",
                content: texto
              }
            ]
          })
        }
      );

      const data = await response.json();

      console.log("Azure:", data);

      resultado = data?.choices?.[0]?.message?.content;
    }

    // =========================
    // VALIDAÇÃO FINAL
    // =========================
    if (!resultado) {
      return res.status(500).json({
        erro: "Resposta vazia da IA"
      });
    }

    // garante retorno JSON válido
    if (!isJSON(resultado)) {
      console.warn("IA não retornou JSON puro");
      return res.json({ result: resultado });
    }

    res.json({ result: resultado });

  } catch (erro) {

    console.error("Erro geral:", erro);

    res.status(500).json({
      erro: "Erro interno no servidor"
    });
  }
});


// ===============================
// START SERVIDOR
// ===============================
app.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});
