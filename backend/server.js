// ===============================
// CARREGA VARIÁVEIS DE AMBIENTE
// ===============================
require('dotenv').config();

// ===============================
// IMPORTAÇÕES E CONFIGURAÇÕES
// ===============================
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// ===============================
// CHAVES E ENDPOINTS
// ===============================
const GEMINI_KEY = process.env.GEMINI_KEY;
const AZURE_KEY = process.env.AZURE_KEY;

const AZURE_ENDPOINT = "https://sentinel-ai-jonas-01-resource.openai.azure.com";
const AZURE_DEPLOYMENT = "gpt-oss-120b";

// ===============================
// ROTA PRINCIPAL (FRONTEND)
// ===============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ===============================
// ROTA DA API - PROCESSAMENTO TÁTICO
// ===============================
app.post("/analisar", async (req, res) => {
  const { texto, modelo } = req.body;

  if (!texto || !modelo) {
    return res.status(400).json({ erro: "Texto ou modelo não informado." });
  }

  if (!GEMINI_KEY || !AZURE_KEY) {
    return res.status(500).json({ erro: "Chaves de API ausentes no container." });
  }

  try {
    let resultado = "";

    // =========================
    // ROTEAMENTO: GEMINI
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
                    text: `Responda SOMENTE em JSON:\n{\n  "tipo": "",\n  "risco": "",\n  "acoes": [],\n  "justificativa": ""\n}\n\nOCORRÊNCIA: ${texto}`
                  }
                ]
              }
            ],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );

      if (!response.ok) {
        console.error("Erro Gemini:", response.status);
        return res.status(500).json({ erro: "Falha na API Gemini." });
      }

      const data = await response.json();
      resultado = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    // =========================
    // ROTEAMENTO: AZURE
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
                content: `Você é um agente de segurança pública.\nResponda EXCLUSIVAMENTE em JSON válido:\n{\n  "tipo": "",\n  "risco": "",\n  "acoes": [],\n  "justificativa": ""\n}`
              },
              {
                role: "user",
                content: texto
              }
            ]
            // REMOVIDO: response_format: { type: "json_object" }
            // Muitos deployments acusam Erro 400 com essa flag. O prompt do sistema já garante o formato.
          })
        }
      );

      if (!response.ok) {
        // [NOVO RASTREADOR DE ERROS] Lê a mensagem real que a Microsoft devolveu
        const errorBody = await response.text();
        console.error("❌ Erro Crítico Azure - Status:", response.status);
        console.error("❌ Motivo dado pela Azure:", errorBody);
        
        return res.status(500).json({ erro: "Falha na comunicação com a API Azure. Verifique os logs do Docker." });
      }

      const data = await response.json();
      resultado = data?.choices?.[0]?.message?.content;
    }

    // Modelo inválido
    else {
      return res.status(400).json({ erro: "Modelo selecionado é inválido." });
    }

    // =========================================================
    // PARSE DO JSON (Tratamento Universal)
    // =========================================================
    try {
      const resultadoObjeto = typeof resultado === 'string' ? JSON.parse(resultado) : resultado;
      res.json({ result: resultadoObjeto });
    } catch (parseErro) {
      console.error("Falha ao fazer parse do JSON:", parseErro);
      res.json({ result: resultado });
    }

  } catch (erro) {
    console.error("Erro interno:", erro);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Sentinel Backend operacional na porta ${PORT}`);
});