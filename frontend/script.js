// =========================
// FUNÇÃO PRINCIPAL: ANALISAR
// =========================
async function analisar() {

  // =========================
  // CAPTURA DOS ELEMENTOS
  // =========================
  const texto = document.getElementById("input").value;
  const modelo = document.getElementById("modelo").value;
  const saida = document.getElementById("saida");

  // =========================
  // VALIDAÇÃO DE ENTRADA
  // =========================
  if (!texto || !texto.trim()) {
    saida.innerHTML = "<p style='color: #ffaa00;'>⚠️ Informe uma ocorrência antes de analisar.</p>";
    return;
  }

  // =========================
  // FEEDBACK VISUAL INICIAL
  // =========================
  saida.innerHTML = "<p>🤖 Processando ocorrência no motor de inteligência...</p>";

  try {
    // =========================
    // DEFINE URL DO BACKEND
    // =========================
    // Garante que, se estiver usando Live Server (localhost ou 127.0.0.1),
    // a requisição aponte diretamente para a porta 3000 onde o Docker está.
    // Caso contrário (produção), usa a rota relativa padrão.
    const hostname = window.location.hostname;
    const API_URL = (hostname === "localhost" || hostname === "127.0.0.1")
      ? "http://localhost:3000/analisar"
      : "/analisar";

    // =========================
    // REQUISIÇÃO PARA O BACKEND
    // =========================
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ texto, modelo })
    });

    // =========================
    // VALIDA STATUS DA RESPOSTA HTTP
    // =========================
    if (!response.ok) {
      console.error("Erro HTTP:", response.status);
      saida.innerHTML = "<p style='color: #ff5555;'>❌ Erro ao processar requisição no servidor.</p>";
      return;
    }

    const data = await response.json();

    // =========================
    // EXTRAÇÃO DOS DADOS TÁTICOS
    // =========================
    // Como o backend agora converte o dado antes de enviar, 'data.result'
    // já chega como um objeto real. O JSON.parse() duplo foi removido.
    let obj = data.result;

    // Fallback de segurança: caso a IA alucine e devolva uma string crua,
    // tentamos converter para evitar a quebra do frontend.
    if (typeof obj === 'string') {
      try {
        obj = JSON.parse(obj);
      } catch (erro) {
        console.warn("A IA não retornou um formato JSON válido:", obj);
        saida.innerHTML = "<p style='color: #ffaa00;'>⚠️ A IA retornou dados em um formato imprevisto.</p>";
        return;
      }
    }

    // =========================
    // NORMALIZA DADOS (evita 'undefined')
    // =========================
    const tipo = obj?.tipo || "Não informado";
    const risco = obj?.risco || "Indefinido";
    const acoes = Array.isArray(obj?.acoes) ? obj.acoes : [];
    const justificativa = obj?.justificativa || "Sem justificativa disponível";

    // =========================
    // DEFINIÇÃO DE COR DO RISCO
    // =========================
    let classeRisco = "risco-baixo"; // Padrão
    const riscoLower = risco.toLowerCase();

    if (riscoLower.includes("alto")) {
      classeRisco = "risco-alto";
    } else if (riscoLower.includes("médio") || riscoLower.includes("medio")) {
      classeRisco = "risco-medio";
    }

    // =========================
    // RENDERIZAÇÃO DO RESULTADO
    // =========================
    // Monta a interface injetando os dados processados
    saida.innerHTML = `
      <div class="card">
        <h2>📌 Tipo da Ocorrência</h2>
        <p>${tipo}</p>

        <h2>⚠️ Nível de Risco</h2>
        <p class="${classeRisco}">${risco}</p>

        <h2>📋 Ações Recomendadas</h2>
        <ul>
          ${acoes.length > 0 
            ? acoes.map(acao => `<li>✔ ${acao}</li>`).join("") 
            : "<li>Nenhuma ação específica sugerida pela IA.</li>"}
        </ul>

        <h2>🧠 Justificativa</h2>
        <p>${justificativa}</p>
      </div>
    `;

  } catch (erro) {
    // =========================
    // TRATAMENTO DE ERRO GERAL
    // =========================
    console.error("Erro geral de comunicação:", erro);
    saida.innerHTML = "<p style='color: #ff5555;'>❌ Falha de conexão. O servidor (Docker) pode estar offline.</p>";
  }
}