// ===============================
// CARREGA VARIÁVEIS DE AMBIENTE
// ===============================
require("dotenv").config();

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

app.use(cors());
app.use(express.json());

// ===============================
// SERVE FRONTEND
// ===============================
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ===============================
// VARIÁVEIS
// ===============================
const GEMINI_KEY = process.env.GEMINI_KEY;

const AZURE_KEY = process.env.AZURE_KEY;
const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT;
const AZURE_DEPLOYMENT = process.env.AZURE_DEPLOYMENT;

// DEBUG
console.log("✅ Azure Endpoint:", AZURE_ENDPOINT);
console.log("✅ Azure Deployment:", AZURE_DEPLOYMENT);

// ===============================
// AUXILIAR
// ===============================
function garantirStringJSON(resposta) {
  if (!resposta) return null;
  if (typeof resposta === "string") return resposta;
  return JSON.stringify(resposta);
}

// ===============================
// ROTA API
// ===============================
app.post("/analisar", async (req, res) => {
  const { texto, modelo } = req.body;

  if (!texto) {
    return res.status(400).json({ erro: "Texto não informado" });
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

      const data = await response.json();
      resultado = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    // =========================
    // AZURE FOUNDRY ✅ (CORRIGIDO)
    // =========================
    else if (modelo === "azure") {
      // Garante que não existem barras duplicadas no final da URL base
      const baseEndpoint = AZURE_ENDPOINT.endsWith("/") ? AZURE_ENDPOINT.slice(0, -1) : AZURE_ENDPOINT;
      
      // Ajustado para o padrão oficial Chat Completions do Azure AI Foundry / Serverless
      const urlCompleta = `${baseEndpoint}/chat/completions?api-version=2024-05-01-preview`;

      const response = await fetch(urlCompleta, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_KEY
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Responda EXCLUSIVAMENTE em JSON:

{
  "tipo": "",
  "risco": "",
  "acoes": [],
  "justificativa": ""
}

OCORRÊNCIA: ${texto}`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        })
      });

      // Se a resposta falhar, captura o log exato da Azure no terminal do Render
      if (!response.ok) {
        const erroTexto = await response.text();
        console.error("❌ ERRO DETALHADO AZURE:", erroTexto);

        return res.status(response.status).json({
          erro: "Erro retornado pela API da Azure",
          detalhe: erroTexto
        });
      }

      const data = await response.json();
      console.log("✅ RESPOSTA AZURE:", JSON.stringify(data, null, 2));

      // Extração padrão seguindo a estrutura Chat Completions (choices -> message -> content)
      let resposta = data?.choices?.[0]?.message?.content;

      if (!resposta) {
        throw new Error("Azure não retornou conteúdo válido na estrutura 'choices[0].message.content'");
      }

      resultado = garantirStringJSON(resposta);
    }

    // =========================
    // MODELO INVÁLIDO
    // =========================
    else {
      return res.status(400).json({ erro: "Modelo inválido" });
    }

    // =========================
    // VALIDAÇÃO FINAL
    // =========================
    if (!resultado) {
      return res.status(500).json({
        erro: "IA não retornou resultado válido"
      });
    }

    res.json({ result: resultado });

  } catch (erro) {
    console.error("💥 ERRO GERAL:", erro);

    res.status(500).json({
      erro: "Erro ao processar requisição",
      detalhe: erro.message
    });
  }
});

// ===============================
// START
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
