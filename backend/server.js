// ===============================
// CARREGA VARIÁVEIS DE AMBIENTE
// ===============================
// O dotenv lê o arquivo .env local. No Render, ele ignora o .env e usa 
// as variáveis que você salvou direto no painel (Dashboard).
require("dotenv").config();

// ===============================
// IMPORTAÇÕES / DEPENDÊNCIAS
// ===============================
const express = require("express");
const cors = require("cors");
const path = require("path");

// O 'node-fetch' é importado dinamicamente para garantir compatibilidade 
// com requisições HTTP do tipo fetch dentro do ecossistema Node.js.
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// ===============================
// CONFIGURAÇÃO DO SERVIDOR EXPRESS
// ===============================
const app = express();

app.use(cors()); // Permite que o seu frontend acesse a API sem problemas de segurança de origens diferentes
app.use(express.json()); // Configura o servidor para entender payloads enviados em formato JSON

// ===============================
// SERVE OS ARQUIVOS ESTÁTICOS DO FRONTEND
// ===============================
// Mapeia a pasta do frontend para que o navegador consiga carregar o CSS, JS e imagens da tela.
app.use(express.static(path.join(__dirname, "../frontend")));

// Rota raiz: quando alguém acessa o link do Render, o servidor entrega o index.html
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

// LOGS DE INICIALIZAÇÃO: Mostram no terminal do Render se as variáveis foram carregadas
console.log("✅ Azure Endpoint configurado:", AZURE_ENDPOINT);
console.log("✅ Azure Deployment configurado:", AZURE_DEPLOYMENT);

// ===============================
// FUNÇÃO AUXILIAR
// ===============================
// Garante que o retorno para o frontend seja uma String válida em formato JSON.
function garantirStringJSON(resposta) {
  if (!resposta) return null;
  if (typeof resposta === "string") return resposta;
  return JSON.stringify(resposta);
}

// ===============================
// ROTA PRINCIPAL DA API: /analisar
// ===============================
app.post("/analisar", async (req, res) => {
  // Destrutura o texto da ocorrência e o modelo selecionado (gemini ou azure) vindo do frontend
  const { texto, modelo } = req.body;

  // Validação básica se o campo de texto veio vazio
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
                    text: `Responda SOMENTE em JSON:\n\n{\n  "tipo": "",\n  "risco": "",\n  "acoes": [],\n  "justificativa": ""\n}\n\nOCORRÊNCIA: ${texto}`
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json" // Força o Gemini a devolver JSON puro
            }
          })
        }
      );

      const data = await response.json();
      resultado = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    // ==========================================
    // FLUXO: MICROSOFT AZURE AI FOUNDRY (CORRIGIDO)
    // ==========================================
    else if (modelo === "azure") {
      // 1. Sanitização da URL: Remove barras '/' extras se o usuário tiver colado no Render por engano
      const baseEndpoint = AZURE_ENDPOINT.endsWith("/") ? AZURE_ENDPOINT.slice(0, -1) : AZURE_ENDPOINT;
      
      // 2. CORREÇÃO DA API-VERSION: Trocamos o '-preview' por '2024-02-01', que é a versão estável (GA) 
      // exigida pelo endpoint unificado (/openai/v1) do Azure OpenAI Services.
      const urlCompleta = `${baseEndpoint}/chat/completions?api-version=2024-02-01`;

      // 3. Dispara a requisição HTTP POST para a Azure
      const response = await fetch(urlCompleta, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_KEY // Passa a chave de autenticação configurada no Render
        },
        body: JSON.stringify({
          // Estrutura padrão de Chat Completions exigida pela API da OpenAI/Azure
          messages: [
            {
              role: "user",
              content: `Responda EXCLUSIVAMENTE em JSON:\n\n{\n  "tipo": "",\n  "risco": "",\n  "acoes": [],\n  "justificativa": ""\n}\n\nOCORRÊNCIA: ${texto}`
            }
          ],
          response_format: { type: "json_object" }, // Garante que o modelo estruture a saída em JSON estruturado
          temperature: 0.1 // Temperatura baixa mantém a resposta técnica, direta e determinística
        })
      });

      // 4. TRATAMENTO DE ERRO: Se a Azure responder qualquer Status diferente de 200 (OK),
      // o código entra aqui e printa o erro exato no terminal do Render para sabermos o motivo.
      if (!response.ok) {
        const erroTexto = await response.text();
        console.error("❌ ERRO DETALHADO RETORNADO PELA AZURE:", erroTexto);

        return res.status(response.status).json({
          erro: "Erro retornado pela API da Azure",
          detalhe: erroTexto
        });
      }

      // 5. Sucesso: Consome o JSON de resposta da Azure
      const data = await response.json();
      console.log("✅ RESPOSTA BRUTA DA AZURE RECEBIDA COM SUCESSO");

      // 6. Extração dos dados: No padrão de chat da OpenAI, o texto da IA fica dentro de choices[0].message.content
      let resposta = data?.choices?.[0]?.message?.content;

      if (!resposta) {
        throw new Error("Azure respondeu, mas a estrutura 'choices[0].message.content' não foi encontrada.");
      }

      resultado = garantirStringJSON(resposta);
    }

    // ==========================================
    // MODELO INVÁLIDO / NÃO CONFIGURADO
    // ==========================================
    else {
      return res.status(400).json({ erro: "Modelo de IA inválido" });
    }

    // ==========================================
    // VALIDAÇÃO E ENVIO DE RESPOSTA AO FRONTEND
    // ==========================================
    if (!resultado) {
      return res.status(500).json({
        erro: "A Inteligência Artificial não retornou um resultado válido"
      });
    }

    // Devolve o JSON final estruturado para o frontend renderizar na tela
    res.json({ result: resultado });

  } catch (erro) {
    // Captura falhas críticas de infraestrutura (ex: queda de internet, DNS quebrado ou erro de sintaxe)
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
