// =========================
// FUNÇÃO PRINCIPAL
// =========================
async function analisar() {

  // =========================
  // CAPTURA DOS ELEMENTOS
  // =========================
  const texto = document.getElementById("input").value;     // texto digitado pelo usuário
  const modelo = document.getElementById("modelo").value;   // IA escolhida (Gemini ou Azure)
  const saida = document.getElementById("saida");           // área onde vai mostrar resultado

  // =========================
  // VALIDAÇÃO DE ENTRADA
  // =========================
  // evita envio vazio
  if (!texto.trim()) {
    saida.innerText = "⚠️ Informe uma ocorrência antes de analisar.";
    return;
  }

  // =========================
  // MENSAGEM DE PROCESSAMENTO
  // =========================
  saida.innerHTML = "🤖 Analisando ocorrência...";


  try {

    // =========================
    // CHAMADA PARA O BACKEND
    // =========================
    const response = await fetch("http://localhost:3000/analisar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ texto, modelo }) // envia texto + tipo de IA
    });

    // converte resposta para JSON
    const data = await response.json();

    // resultado vindo da IA
    const mensagem = data.result;


    // =========================
    // CONVERSÃO DO JSON
    // =========================
    let obj;

    try {
      obj = JSON.parse(mensagem); // tenta converter resposta IA em JSON
    } catch {
      // se falhar, mostra erro amigável
      saida.innerText = "⚠️ A IA não retornou JSON válido.";
      return;
    }


    // =========================
    // DEFINIÇÃO DE COR DO RISCO
    // =========================
    let classeRisco = "";

    if (obj.risco.toLowerCase().includes("alto")) {
      classeRisco = "risco-alto";
    } else if (obj.risco.toLowerCase().includes("médio")) {
      classeRisco = "risco-medio";
    } else {
      classeRisco = "risco-baixo";
    }


    // =========================
    // GERAÇÃO DO HTML VISUAL
    // =========================
    saida.innerHTML = `

      <div class="card">

        <h2>📌 Tipo da Ocorrência</h2>
        <p>${obj.tipo}</p>

        <h2>⚠️ Nível de Risco</h2>
        <p class="${classeRisco}">${obj.risco}</p>

        <h2>📋 Ações Recomendadas</h2>
        <ul>
          ${obj.acoes.map(acao => `<li>✔ ${acao}</li>`).join("")}
        </ul>

        <h2>🧠 Justificativa</h2>
        <p>${obj.justificativa}</p>

      </div>
    `;

  } catch (erro) {

    // =========================
    // TRATAMENTO DE ERROS
    // =========================
    console.error("Erro:", erro);

    saida.innerText = "❌ Erro ao comunicar com o servidor.";
  }
}
