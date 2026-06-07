// ===============================
// CARREGA VARIÁVEIS DE AMBIENTE
// ===============================
require('dotenv').config();

// ===============================
// IMPORTAÇÕES
// ===============================
const express = require("express");
const cors = require("cors");
const path = require("path");

// fetch compatível com Node
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// ===============================
// CONFIGURAÇÃO DO SERVIDOR
// ===============================
const app = express();

// permite requisições externas (API)
app.use(cors());

// permite receber JSON no body
app.use(express.json());


// ===============================
// SERVE FRONTEND (HTML, CSS, JS)
// ===============================
// tudo que está em /frontend será servido automaticamente
app.use(express.static(path.join(__dirname, "../frontend")));


// ===============================
// CONFIGURAÇÕES (CHAVES + MODELOS)
// ===============================
const GEMINI_KEY = process.env.GEMINI_KEY;
const AZURE_KEY = process.env.AZURE_KEY;

const AZURE_ENDPOINT = "https://sentinel-ai-jonas-01-resource.openai.azure.com";
const AZURE_DEPLOYMENT = "gpt-oss-120b";


// ===============================
// FUNÇÃO AUXILIAR
// ===============================
// garante retorno sempre como string JSON
function garantirStringJSON(resposta) {
  if (!resposta) return null;
  if (typeof resposta === "string") return resposta;
  return JSON.stringify(resposta);
}


// ===============================
// ROTA PRINCIPAL (FRONTEND)
// ===============================
// quando acessar "/" carrega o index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});


// ===============================
// ROTA DA API
// ===============================
app.post("/analisar", async (req, res) => {

  const { texto, modelo } = req.body;

  console.log("Texto:", texto);
  console.log("Modelo:", modelo);

  // valida entradas
  if (!texto) {
    return res.status(400).json({ erro: "Texto não informado" });
  }

  if (!modelo) {
    return res.status(400).json({ erro: "Modelo não informado" });
  }

  if (!GEMINI_KEY || !AZURE_KEY) {
    return res.status(500).json({
      erro: "Chaves de API não configuradas"
    });
  }

  try {

    let resultado = "";

    // =========================
    // GEMINI
    // =========================
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

      if (!response.ok) {
        console.error("Erro Gemini:", response.status);
        return res.status(500).json({ erro: "Erro na API Gemini" });
      }

      const data = await response.json();

      resultado = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    // =========================
    // AZURE
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

Responda EXCLUSIVAMENTE em JSON válido:

{
  "tipo": "",
  "risco": "",
  "acoes": [],
  "justificativa": ""
}`
              },
              {
                role: "user",
                content: texto
              }
            ],
            response_format: { type: "json_object" }
          })
        }
      );

      if (!response.ok) {
        console.error("Erro Azure:", response.status);
        return res.status(500).json({ erro: "Erro na API Azure" });
      }

      const data = await response.json();

      const respostaAzure = data?.choices?.[0]?.message?.content;

      resultado = garantirStringJSON(respostaAzure);
    }

    // modelo inválido
    else {
      return res.status(400).json({ erro: "Modelo inválido" });
    }

    if (!resultado) {
      return res.status(500).json({
        erro: "A IA não retornou resultado válido"
      });
    }

    res.json({ result: resultado });

  } catch (erro) {

    console.error("Erro geral:", erro);

    res.status(500).json({
      erro: "Erro interno do servidor"
    });
  }
});


// ===============================
// START DO SERVIDOR
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});