// =========================
// FUNÇÃO PRINCIPAL: ANALISAR
// =========================
async function analisar() {

  // =========================
  // CAPTURA DOS ELEMENTOS DA INTERFACE
  // =========================
  const texto = document.getElementById("input").value;
  const modelo = document.getElementById("modelo").value;
  const saida = document.getElementById("saida");

  // =========================
  // VALIDAÇÃO DE ENTRADA
  // =========================
  if (!texto || !texto.trim()) {
    saida.innerHTML = "<p style='color:#ffaa00;'>⚠️ Informe uma ocorrência antes de analisar.</p>";
    return;
  }

  // =========================
  // FEEDBACK DE PROCESSAMENTO
  // =========================
  saida.innerHTML = "<p>🤖 Processando ocorrência...</p>";

  try {

    // =========================
    // DEFINIÇÃO DA URL
    // =========================
    const hostname = window.location.hostname;
    const API_URL = (hostname === "localhost" || hostname === "127.0.0.1")
      ? "http://localhost:3000/analisar"
      : "/analisar";

    // =========================
    // CHAMADA DA API
    // =========================
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ texto, modelo })
    });

    if (!response.ok) {
      saida.innerHTML = "<p style='color:red;'>❌ Erro no servidor.</p>";
      return;
    }

    const data = await response.json();

    // =========================
    // EXTRAÇÃO DO RESULTADO
    // =========================
    let obj = data.result;

    // fallback caso venha string
    if (typeof obj === "string") {
      try {
        obj = JSON.parse(obj);
      } catch {
        saida.innerHTML = "<p style='color:#ffaa00;'>⚠️ Resposta inválida da IA.</p>";
        return;
      }
    }

    // =========================
    // NORMALIZAÇÃO
    // =========================
    const tipo = obj?.tipo || "Não informado";
    const risco = obj?.risco || "Indefinido";
    const acoes = Array.isArray(obj?.acoes) ? obj.acoes : [];
    const justificativa = obj?.justificativa || "Sem justificativa";

    // =========================
    // DEFINIÇÃO DE COR
    // =========================
    let classeRisco = "risco-baixo";

    if (risco.toLowerCase().includes("alto")) {
      classeRisco = "risco-alto";
    } else if (risco.toLowerCase().includes("médio") || risco.toLowerCase().includes("medio")) {
      classeRisco = "risco-medio";
    }

    // =========================
    // FORMATA JSON BONITO
    // =========================
    const jsonFormatado = JSON.stringify(obj, null, 2);

    // =========================
    // RENDERIZAÇÃO FINAL
    // =========================
    saida.innerHTML = `
      <div class="card">

        <h2>📌 Tipo da Ocorrência</h2>
        <p>${tipo}</p>

        <h2>⚠️ Nível de Risco</h2>
        <p class="${classeRisco}">${risco}</p>

        <h2>📋 Ações Recomendadas</h2>
        <ul>
          ${acoes.length > 0 
            ? acoes.map(a => `<li>✔ ${a}</li>`).join("") 
            : "<li>Nenhuma ação sugerida</li>"}
        </ul>

        <h2>🧠 Justificativa</h2>
        <p>${justificativa}</p>

        <!-- 🔥 NOVO: VISUALIZAÇÃO JSON -->
        <details style="margin-top:20px;">
          <summary style="cursor:pointer; font-weight:bold;">
            📦 Ver JSON estruturado
          </summary>

          <pre style="
            background:#111;
            color:#0f0;
            padding:10px;
            border-radius:6px;
            overflow:auto;
            margin-top:10px;
          ">
${jsonFormatado}
          </pre>
        </details>

      </div>
    `;

    // =========================
    // VALIDAÇÃO DE REASONING (OCULTA)
    // =========================
    if (!justificativa.includes("A compreensão inicial")) {
      console.warn("⚠️ Justificativa fora do padrão esperado");
    }

  } catch (erro) {
    console.error(erro);
    saida.innerHTML = "<p style='color:red;'>❌ Falha de conexão.</p>";
  }
}
``