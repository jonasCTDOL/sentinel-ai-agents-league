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
// VARIÁVEIS DE AMBIENTE
// ===============================
const GEMINI_KEY = process.env.GEMINI_KEY;
const AZURE_KEY = process.env.AZURE_KEY;
const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT;
const AZURE_DEPLOYMENT = process.env.AZURE_DEPLOYMENT;

// DEBUG
console.log("✅ Gemini:", GEMINI_KEY ? "OK" : "MISSING");
console.log("✅ Azure Key:", AZURE_KEY ? "OK" : "MISSING");
console.log("✅ Endpoint:", AZURE_ENDPOINT);
console.log("✅ Deployment:", AZURE_DEPLOYMENT);

// ===============================
// FUNÇÃO AUXILIAR
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

  console.log("📩 Texto:", texto);
  console.log("🤖 Modelo:", modelo);

  if (!texto) {
    return res.status(400).json({ erro: "Texto não informado" });
  }

  if (!modelo) {
    return res.status(400).json({ erro: "Modelo não informado" });
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
        const erroTexto = await response.text();
        console.error("❌ Erro Gemini:", erroTexto);

        return res.status(500).json({
          erro: "Erro Gemini",
          detalhe: erroTexto
        });
      }

      const data = await response.json();
      resultado = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    // =========================
    // AZURE (CORRIGIDO)
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
                role: "user",
                content: `Responda EXCLUSIVAMENTE em JSON válido:

{
  "tipo": "",
  "risco": "",
  "acoes": [],
  "justificativa": ""
}

OCORRÊNCIA: ${texto}`
              }
            ],
            temperature: 0.2,
            max_tokens: 800
          })
        }
      );

      // ✅ LOG COMPLETO DO ERRO
      if (!response.ok) {
        const erroTexto = await response.text();
        console.error("❌ ERRO AZURE DETALHADO:", erroTexto);

        return res.status(500).json({
          erro: "Erro Azure",
          detalhe: erroTexto
        });
      }

      const data = await response.json();

      console.log("✅ RESPOSTA AZURE:", JSON.stringify(data, null, 2));

      let respostaAzure = data?.choices?.[0]?.message?.content;

      // ✅ fallback importante (modelo OSS)
      if (!respostaAzure && data?.choices?.[0]?.text) {
        respostaAzure = data.choices[0].text;
      }

      if (!respostaAzure) {
        throw new Error("Azure não retornou conteúdo válido");
      }

      resultado = garantirStringJSON(respostaAzure);
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
        erro: "A IA não retornou resultado válido"
      });
    }

    res.json({ result: resultado });

  } catch (erro) {
    console.error("💥 ERRO GERAL:", erro);

    res.status(500).json({
      erro: "Erro ao processar requisição"
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
