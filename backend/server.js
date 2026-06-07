// ===============================
// CARREGA VARIÁVEIS DE AMBIENTE
// ===============================
require("dotenv").config();

// ===============================
// IMPORTAÇÕES / DEPENDÊNCIAS
// ===============================
const express = require("express");
const cors = require("cors");
const path = require("path");

// fetch compatível com Node.js
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// ===============================
// CONFIGURAÇÃO DO SERVIDOR EXPRESS
// ===============================
const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// SERVE OS ARQUIVOS ESTÁTICOS DO FRONTEND
// ===============================
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ===============================
// MAPEAMENTO DE VARIÁVEIS DE AMBIENTE
// ===============================
const GEMINI_KEY = process.env.GEMINI_KEY;

const AZURE_KEY = process.env.AZURE_KEY;
const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT;
const AZURE_DEPLOYMENT = process.env.AZURE_DEPLOYMENT;

// Nova variável dinâmica para controlar a versão da API diretamente do Render se necessário
const AZURE_API_VERSION = process.env.AZURE_API_VERSION || "2024-06-01";

// LOGS DE INICIALIZAÇÃO
console.log("✅ Azure Endpoint:", AZURE_ENDPOINT);
console.log("✅ Azure Deployment:", AZURE_DEPLOYMENT);
console.log("✅ Azure API Version ativa:", AZURE_API_VERSION);

// ===============================
// FUNÇÃO AUXILIAR
// ===============================
function garantizarStringJSON(resposta) {
  if (!resposta) return null;
  if (typeof resposta === "string") return resposta;
  return JSON.stringify(resposta);
}

// ===============================
// ROTA PRINCIPAL DA API: /analisar
// ===============================
app.post("/analisar", async (req, res) => {
  const { texto, modelo } = req.body;

  if (!texto) {
    return res.status(400).json({ erro: "Texto não informado" });
  }

  try {
    let resultado = "";

    // ==========================================
    // FLUXO: GOOGLE GEMINI
    // ==========================================
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

    // ==========================================
    // FLUXO: MICROSOFT AZURE AI FOUNDRY
    // ==========================================
    else if (modelo === "azure") {
      // 1. Remove barras '/' extras do final do endpoint se houver
      const baseEndpoint = AZURE_ENDPOINT.endsWith("/") ? AZURE_ENDPOINT.slice(0, -1) : AZURE_ENDPOINT;
      
      // 2. Monta a URL utilizando a versão estável atualizada
      const urlCompleta = `${baseEndpoint}/chat/completions?api-version=${AZURE_API_VERSION}`;

      // 3. Dispara a requisição para o endpoint unificado do Hub da Azure
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

      // 4. Captura erros específicos retornados pela API da Azure
      if (!response.ok) {
        const erroTexto = await response.text();
        console.error("❌ ERRO DETALHADO RETORNADO PELA AZURE:", erroTexto);

        return res.status(response.status).json({
          erro: "Erro retornado pela API da Azure",
          detalhe: erroTexto
        });
      }

      const data = await response.json();
      console.log("✅ RESPOSTA BRUTA DA AZURE RECEBIDA COM SUCESSO");

      // 5. Extração baseada na estrutura padrão do Azure OpenAI Services
      let resposta = data?.choices?.[0]?.message?.content;

      if (!resposta) {
        throw new Error("Azure respondeu, mas a estrutura 'choices[0].message.content' não foi localizada.");
      }

      resultado = garantizarStringJSON(resposta);
    }

    // ==========================================
    // MODELO INVÁLIDO
    // ==========================================
    else {
      return res.status(400).json({ erro: "Modelo de IA inválido" });
    }

    // ==========================================
    // ENVIO DE RESPOSTA AO FRONTEND
    // ==========================================
    if (!resultado) {
      return res.status(500).json({
        erro: "A Inteligência Artificial não retornou um resultado válido"
      });
    }

    res.json({ result: resultado });

  } catch (erro) {
    console.error("💥 ERRO CRÍTICO NO BACKEND (CATCH GERAL):", erro);

    res.status(500).json({
      erro: "Erro ao processar requisição",
      detalhe: erro.message
    });
  }
});

// ===============================
// INICIALIZAÇÃO DO SERVIDOR
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor executando com sucesso na porta ${PORT}`);
});
