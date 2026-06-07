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

// fetch compatível com Node (para chamadas HTTP)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// ===============================
// INICIALIZAÇÃO DO SERVIDOR
// ===============================
const app = express();

// Permite chamadas externas (frontend → backend)
app.use(cors());

// Permite receber JSON no body
app.use(express.json());

// ===============================
// SERVE O FRONTEND
// ===============================
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ===============================
// VARIÁVEIS DE AMBIENTE
// ===============================
const GEMINI_KEY = process.env.GEMINI_KEY;

// 🔑 AZURE
const AZURE_KEY = process.env.AZURE_KEY;
const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT;
const AZURE_DEPLOYMENT = process.env.AZURE_DEPLOYMENT;

// Logs para debug
console.log("✅ Gemini:", GEMINI_KEY ? "OK" : "MISSING");
console.log("✅ Azure Key:", AZURE_KEY ? "OK" : "MISSING");
console.log("✅ Azure Endpoint:", AZURE_ENDPOINT);
console.log("✅ Azure Deployment:", AZURE_DEPLOYMENT);

// ===============================
// FUNÇÃO AUXILIAR
// ===============================
function garantirStringJSON(resposta) {
  if (!resposta) return null;
  if (typeof resposta === "string") return resposta;
  return JSON.stringify(resposta);
}

// ===============================
// ROTA PRINCIPAL DA API
// ===============================
app.post("/analisar", async (req, res) => {
  const { texto, modelo } = req.body;

  console.log("📩 Texto:", texto);
  console.log("🤖 Modelo:", modelo);

  // validações
  if (!texto) {
    return res.status(400).json({ erro: "Texto não informado" });
  }

  if (!modelo) {
    return res.status(400).json({ erro: "Modelo não informado" });
  }

  try {
    let resultado = "";

    // =========================
    // GEMINI (GOOGLE)
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

      // tratamento de erro
      if (!response.ok) {
        const erroTexto = await response.text();
        console.error("❌ Erro Gemini:", erroTexto);

        return res.status(500).json({
          erro: "Erro na API Gemini",
          detalhe: erroTexto
        });
      }

      const data = await response.json();

      resultado = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    // =========================
    // AZURE (FOUNDY / OSS MODEL)
    // =========================
    else if (modelo === "azure") {
      const response = await fetch(
        // 🔥 ENDPOINT CORRETO PARA MODELOS OSS
        `${AZURE_ENDPOINT}/models/${AZURE_DEPLOYMENT}/invoke?api-version=2024-05-01-preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": AZURE_KEY
          },
          body: JSON.stringify({
            input_data: {
              input_string: [
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
              ]
            }
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

      // 🔥 TRATAMENTO FLEXÍVEL (OSS varia formato)
      let respostaAzure =
        data?.output_data?.[0]?.content || // formato comum
        data?.output_text ||              // fallback
        JSON.stringify(data);             // último fallback

      if (!respostaAzure) {
        throw new Error("Azure não retornou conteúdo válido");
      }

      resultado = garantirStringJSON(respostaAzure);
    }

    // =========================
    // MODELO INVÁLIDO
    // =========================
    else {
      return res.status(400).json({
        erro: "Modelo inválido"
      });
    }

    // =========================
    // VALIDAÇÃO FINAL
    // =========================
    if (!resultado) {
      return res.status(500).json({
        erro: "A IA não retornou resultado válido"
      });
    }

    // resposta final
    res.json({ result: resultado });

  } catch (erro) {
    console.error("💥 ERRO GERAL:", erro);

    res.status(500).json({
      erro: "Erro ao processar requisição"
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
