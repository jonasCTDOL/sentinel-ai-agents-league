// =========================
// FUNÇÃO PRINCIPAL
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
    saida.innerText = "⚠️ Informe uma ocorrência antes de analisar.";
    return;
  }

  // =========================
  // FEEDBACK VISUAL
  // =========================
  saida.innerHTML = "🤖 Analisando ocorrência...";


  try {

    // =========================
    // DEFINE URL DO BACKEND
    // =========================
    // Local → localhost
    // Produção → mesmo domínio (/analisar)
    const API_URL = window.location.hostname === "localhost"
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
    // VALIDA STATUS DA RESPOSTA
    // =========================
    if (!response.ok) {
      console.error("Erro HTTP:", response.status);
      saida.innerText = "❌ Erro ao processar requisição.";
      return;
    }

    const data = await response.json();
    const mensagem = data.result;


    // =========================
    // CONVERSÃO PARA JSON
    // =========================
    let obj;

    try {
      obj = JSON.parse(mensagem);
    } catch (erro) {
      console.warn("Resposta não é JSON:", mensagem);
      saida.innerText = "⚠️ Resposta inválida da IA.";
      return;
    }


    // =========================
    // NORMALIZA DADOS (evita undefined)
    // =========================
    const tipo = obj.tipo || "Não informado";
    const risco = obj.risco || "Indefinido";
    const acoes = Array.isArray(obj.acoes) ? obj.acoes : [];
    const justificativa = obj.justificativa || "Sem justificativa disponível";


    // =========================
    // DEFINIÇÃO DE COR DO RISCO
    // =========================
    let classeRisco = "risco-baixo";

    const riscoLower = risco.toLowerCase();

    if (riscoLower.includes("alto")) {
      classeRisco = "risco-alto";
    } else if (riscoLower.includes("médio") || riscoLower.includes("medio")) {
      classeRisco = "risco-medio";
    }


    // =========================
    // RENDERIZAÇÃO DO RESULTADO
    // =========================
    saida.innerHTML = `
      <div class="card">

        <h2>📌 Tipo da Ocorrência</h2>
        <p>${tipo}</p>

        <h2>⚠️ Nível de Risco</h2>
        <p class="${classeRisco}">${risco}</p>

        <h2>📋 Ações Recomendadas</h2>
        <ul>
          ${acoes.map(acao => `<li>✔ ${acao}</li>`).join("")}
        </ul>

        <h2>🧠 Justificativa</h2>
        <p>${justificativa}</p>

      </div>
    `;

  } catch (erro) {

    // =========================
    // ERRO GERAL
    // =========================
    console.error("Erro geral:", erro);

    saida.innerText = "❌ Erro ao comunicar com o servidor.";
  }
}