// ==============================================================================
// 1. CARREGAMENTO DE VARIÁVEIS DE AMBIENTE
// ==============================================================================
// Lê o arquivo .env durante o desenvolvimento local. 
// No Render, as variáveis configuradas no painel sobrescrevem isso automaticamente.
require("dotenv").config();

// ==============================================================================
// 2. IMPORTAÇÕES E DEPENDÊNCIAS
// ==============================================================================
const express = require("express");
const cors = require("cors");
const path = require("path");

// O Node.js mais antigo não tem o 'fetch' nativo como os navegadores.
// Essa linha importa o 'node-fetch' de forma dinâmica para que possamos 
// fazer as requisições HTTP para a Azure e para o Gemini.
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// ==============================================================================
// 3. CONFIGURAÇÃO DO SERVIDOR EXPRESS
// ==============================================================================
const app = express();

// O CORS permite que o seu frontend (HTML/JS) se comunique com este backend sem bloqueios de segurança
app.use(cors());

// Configura o servidor para entender dados enviados no formato JSON no corpo das requisições (req.body)
app.use(express.json());

// ==============================================================================
// 4. MAPEAMENTO DOS ARQUIVOS DO FRONTEND
// ==============================================================================
// Diz ao servidor onde estão os arquivos visuais (HTML, CSS, JS do frontend)
app.use(express.static(path.join(__dirname, "../frontend")));

// Quando o usuário acessar a URL raiz (ex: site.com/), o servidor entrega o index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ==============================================================================
// 5. CARREGAMENTO DAS CHAVES (ENVIRONMENT VARIABLES)
// ==============================================================================
const GEMINI_KEY = process.env.GEMINI_KEY;
const AZURE_KEY = process.env.AZURE_KEY;
const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT;
const AZURE_DEPLOYMENT = process.env.AZURE_DEPLOYMENT;

// Exibe no console do Render se as variáveis da Azure foram carregadas corretamente
console.log("✅ Azure Endpoint:", AZURE_ENDPOINT);
console.log("✅ Azure Deployment (Modelo):", AZURE_DEPLOYMENT);

// ==============================================================================
// 6. FUNÇÕES AUXILIARES (FILTROS E TRATAMENTOS)
// ==============================================================================

/**
 * Função crucial: Modelos de IA costumam adicionar textos inúteis ou blocos 
 * de código (```json ... ```) junto com a resposta. O frontend quebra se tentar 
 * fazer o parse disso. Esta função recorta EXATAMENTE o que é JSON puro.
 */
function extrairJSON(texto) {
  if (!texto) return null;
  
  // Se por acaso já for um objeto JSON (não uma string), transforma em string
  if (typeof texto !== "string") return JSON.stringify(texto);

  // Procura onde começa o objeto JSON '{' e onde ele termina '}'
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");

  // Se encontrou as chaves corretamente, recorta apenas esse miolo
  if (inicio !== -1 && fim !== -1 && fim >= inicio) {
    return texto.substring(inicio, fim + 1);
  }

  // Fallback: Se não achar as chaves por algum motivo, tenta limpar crases de markdown manualmente
  return texto.replace(/```json/gi, "").replace(/```/g, "").trim();
}

// ==============================================================================
// 7. ROTA PRINCIPAL DA API DE ANÁLISE (/analisar)
// ==============================================================================
// Esta é a rota que o seu frontend chama quando o botão "Analisar" é clicado.
app.post("/analisar", async (req, res) => {
  
  // Extrai o texto digitado pelo usuário e qual IA ele escolheu no select
  const { texto, modelo } = req.body;

  // Trava de segurança: se o usuário mandar vazio, devolve erro 400
  if (!texto) {
    return res.status(400).json({ erro: "Texto não informado" });
  }

  try {
    let resultado = "";

    // ---------------------------------------------------------
    // FLUXO 1: GOOGLE GEMINI
    // ---------------------------------------------------------
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
            // Força nativamente o Gemini a retornar um JSON
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        }
      );

      const data = await response.json();
      
      // Caminho padrão do objeto de resposta do Gemini
      let respostaBruta = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      // Passa no filtro de segurança antes de devolver ao frontend
      resultado = extrairJSON(respostaBruta);
    }

    // ---------------------------------------------------------
    // FLUXO 2: MICROSOFT AZURE AI FOUNDRY (MaaS)
    // ---------------------------------------------------------
    else if (modelo === "azure") {
      // Limpa possíveis barras finais '/' coladas sem querer no endpoint do painel
      const baseEndpoint = AZURE_ENDPOINT.endsWith("/") ? AZURE_ENDPOINT.slice(0, -1) : AZURE_ENDPOINT;
      
      // O modelo MaaS imita a rota da OpenAI, então não precisa de ?api-version na URL
      const urlCompleta = `${baseEndpoint}/chat/completions`;

      console.log("🔄 Disparando requisição Azure para:", urlCompleta);

      const response = await fetch(urlCompleta, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // O MaaS aceita Bearer Token, passamos a chave assim para seguir o padrão unificado
          "Authorization": `Bearer ${AZURE_KEY}`,
          "api-key": AZURE_KEY 
        },
        body: JSON.stringify({
          // O nome do modelo (gpt-oss-120b) vai aqui dentro do corpo da requisição
          model: AZURE_DEPLOYMENT, 
          messages: [
            // O System message força a IA a não ser "tagarela" e focar apenas no JSON
            {
              role: "system",
              content: "Você é um analista de segurança. Responda APENAS com um objeto JSON válido, sem formatação Markdown, sem blocos de código (```) e sem textos adicionais de introdução."
            },
            // A instrução do usuário contendo o template e o texto da ocorrência
            {
              role: "user",
              content: `Estruture os dados EXCLUSIVAMENTE neste formato JSON estrito:\n\n{\n  "tipo": "",\n  "risco": "",\n  "acoes": [],\n  "justificativa": ""\n}\n\nOCORRÊNCIA: ${texto}`
            }
          ],
          // Pede amigavelmente para o modelo respeitar a estrutura de objeto
          response_format: { type: "json_object" },
          temperature: 0.1 // Temperatura baixa = Respostas mais padronizadas e menos criativas
        })
      });

      // Se a requisição falhar (ex: chave vencida), captura o erro exato para vermos no log
      if (!response.ok) {
        const erroTexto = await response.text();
        console.error("❌ ERRO DETALHADO RETORNADO PELA AZURE:", erroTexto);
        return res.status(response.status).json({
          erro: "Erro retornado pela API da Azure",
          detalhe: erroTexto
        });
      }

      const data = await response.json();
      console.log("✅ RESPOSTA DA AZURE RECEBIDA COM SUCESSO");

      // Caminho padrão onde a resposta em texto fica guardada na API da Azure/OpenAI
      let respostaBruta = data?.choices?.[0]?.message?.content;

      if (!respostaBruta) {
        throw new Error("Azure respondeu, mas a estrutura de texto não foi localizada no JSON.");
      }

      // Loga a string suja no painel do Render para fins de auditoria (caso algo dê errado)
      console.log("🔍 Texto original retornado pela IA da Azure:", respostaBruta);

      // Passa o texto sujo pela função de extração que corta qualquer lixo e deixa só o JSON
      resultado = extrairJSON(respostaBruta);
    }

    // ---------------------------------------------------------
    // FLUXO 3: MODELO NÃO RECONHECIDO
    // ---------------------------------------------------------
    else {
      return res.status(400).json({ erro: "Modelo de IA inválido ou não configurado." });
    }

    // ==============================================================================
    // 8. VALIDAÇÃO FINAL E RESPOSTA AO FRONTEND
    // ==============================================================================
    // Se, mesmo com tudo isso, a variável resultado estiver vazia, acusa erro.
    if (!resultado) {
      return res.status(500).json({
        erro: "A Inteligência Artificial não retornou um resultado válido após a filtragem."
      });
    }

    // Devolve o JSON extraído e validado para que o frontend consiga preencher os cards na tela
    res.json({ result: resultado });

  } catch (erro) {
    // Esse catch captura falhas de servidor, rede ou de parsing grave
    console.error("💥 ERRO CRÍTICO NO BACKEND:", erro);

    res.status(500).json({
      erro: "Erro ao processar requisição no servidor",
      detalhe: erro.message
    });
  }
});

// ==============================================================================
// 9. INICIALIZAÇÃO DO SERVIDOR (LISTEN)
// ==============================================================================
// Define a porta do servidor. O Render fornece a porta via process.env.PORT. 
// Caso esteja rodando local no seu PC, usa a porta 3000.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor executando com sucesso na porta ${PORT}`);
});
