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

// LOGS DE INICIALIZAÇÃO
console.log("✅ Azure Endpoint:", AZURE_ENDPOINT);
console.log("✅ Azure Deployment:", AZURE_DEPLOYMENT);

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
      const baseEndpoint = AZURE_ENDPOINT.endsWith("/") ? AZURE_ENDPOINT.slice(0, -1) : AZURE_ENDPOINT;
      
      // Lista de combinações de URLs e Versões comuns para os dois tipos de Hub da Azure
      const tentativasConfig = [
        {
          // Tentativa 1: Formato unificado de serviços de IA com versão estável padrão
          url: `${baseEndpoint}/chat/completions?api-version=2024-02-01`,
          payloadEstilo: "openai"
        },
        {
          // Tentativa 2: Formato unificado com versão estável atualizada
          url: `${baseEndpoint}/chat/completions?api-version=2024-06-01`,
          payloadEstilo: "openai"
        },
        {
          // Tentativa 3: Se o endpoint tiver /openai/v1 no final, removemos para testar a rota direta do Foundry Hub
          url: `${baseEndpoint.replace("/openai/v1", "")}/chat/completions?api-version=2024-05-01-preview`,
          payloadEstilo: "openai"
        },
        {
          // Tentativa 4: Formato estrito do Azure AI Foundry Serverless (MaaS)
          url: `${baseEndpoint.replace("/openai/v1", "")}/models/${AZURE_DEPLOYMENT}/invoke?api-version=2024-05-01-preview`,
          payloadEstilo: "foundry_maas"
        }
      ];

      let response;
      let erroUltimaTentativa = "";
      let sucessoAzure = false;

      // Percorre a lista de tentativas até uma funcionar
      for (let i = 0; i < tentativasConfig.length; i++) {
        const tentativa = tentativasConfig[i];
        console.log(`🔄 Tentando conexão Azure (Estratégia ${i + 1}/${tentativasConfig.length})...`);

        // Monta o body de acordo com o que o endpoint espera
        let bodyPayload = {};
        if (tentativa.payloadEstilo === "openai") {
          bodyPayload = {
            messages: [{ role: "user", content: `Responda EXCLUSIVAMENTE em JSON:\n\n{\n  "tipo": "",\n  "risco": "",\n  "acoes": [],\n  "justificativa": ""\n}\n\nOCORRÊNCIA: ${texto}` }],
            response_format: { type: "json_object" },
            temperature: 0.1
          };
        } else {
          bodyPayload = {
            input_data: {
              input_string: [{ role: "user", content: `Responda EXCLUSIVAMENTE em JSON:\n\n{\n  "tipo": "",\n  "risco": "",\n  "acoes": [],\n  "justificativa": ""\n}\n\nOCORRÊNCIA: ${texto}` }]
            }
          };
        }

        try {
          response = await fetch(tentativa.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "api-key": AZURE_KEY
            },
            body: JSON.stringify(bodyPayload)
          });

          if (response.ok) {
            console.log(`✅ Sucesso na Estratégia ${i + 1}!`);
            sucessoAzure = true;
            break; // Interrompe o loop se conseguir um status 200 OK
          } else {
            erroUltimaTentativa = await response.text();
            console.warn(`⚠️ Estratégia ${i + 1} falhou. Resposta: ${erroUltimaTentativa}`);
          }
        } catch (err) {
          erroUltimaTentativa = err.message;
          console.warn(`⚠️ Erro de conexão na Estratégia ${i + 1}: ${err.message}`);
        }
      }

      // Se passou por todas as estratégias e nenhuma deu certo, encerra com erro
      if (!sucessoAzure) {
        console.error("❌ TODAS AS ESTRATÉGIAS DA AZURE FALHARAM.");
        return res.status(500).json({
          erro: "Erro retornado pela API da Azure",
          detalhe: erroUltimaTentativa
        });
      }

      const data = await response.json();
      console.log("✅ RESPOSTA BRUTA DA AZURE RECEBIDA COM SUCESSO");

      // Faz o parse inteligente dependendo do formato que respondeu
      let resposta = 
        data?.choices?.[0]?.message?.content || 
        data?.output_data?.[0]?.content || 
        data?.output_text;

      if (!resposta) {
        throw new Error("Azure respondeu com sucesso, mas a estrutura de conteúdo de texto não foi localizada no JSON.");
      }

      resultado = garantirStringJSON(resposta);
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
