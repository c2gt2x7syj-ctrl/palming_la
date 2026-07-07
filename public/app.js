const form = document.querySelector("#product-form");
const imageInput = document.querySelector("#image");
const preview = document.querySelector("#preview");
const statusEl = document.querySelector("#status");
const button = document.querySelector(".primary-button");

const suggestedTitleEl = document.querySelector("#suggested-title");
const alternateTitlesEl = document.querySelector("#alternate-titles");
const descriptionEl = document.querySelector("#description");
const hotLabelEl = document.querySelector("#hot-label");
const scoreReasonsEl = document.querySelector("#score-reasons");
const photoReviewEl = document.querySelector("#photo-review");
const scoreBadgeEl = document.querySelector("#score-badge");
const hotScoreEl = document.querySelector("#hot-score");
const hotStarsEl = document.querySelector("#hot-stars");
const instagramHookEl = document.querySelector("#instagram-hook");
const instagramCaptionEl = document.querySelector("#instagram-caption");
const instagramCtaEl = document.querySelector("#instagram-cta");
const instagramHashtagsEl = document.querySelector("#instagram-hashtags");
const instagramTipsEl = document.querySelector("#instagram-tips");
const historyStatusEl = document.querySelector("#history-status");
const historyGroupsEl = document.querySelector("#history-groups");
const refreshHistoryButton = document.querySelector("#refresh-history");
const saveAnalysisButton = document.querySelector("#save-analysis");
const saveStatusEl = document.querySelector("#save-status");
const submitButtons = document.querySelectorAll(".primary-button");

let imageDataUrl = "";
let currentPayload = null;
let currentResult = null;

function renderList(element, items) {
  if (!element) return;
  element.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    element.appendChild(li);
  });
  element.classList.remove("muted");
}

function setText(element, value) {
  if (!element) return;
  element.textContent = value;
  element.classList.remove("muted");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderStars(score) {
  const total = 5;
  return Array.from({ length: total }, (_, index) => (index < score ? "★" : "☆")).join("");
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function renderHistoryGroups(groups) {
  if (!historyGroupsEl) return;

  if (!groups?.length) {
    historyGroupsEl.innerHTML = '<p class="muted">Nenhuma análise salva ainda.</p>';
    return;
  }

  historyGroupsEl.innerHTML = groups
    .map((group) => {
      const items = group.items
        .map(
          (item) => `
            <article class="history-item">
              <div class="history-item-top">
                <strong>${item.suggested_title || item.product_name || "Item sem título"}</strong>
                <span>${item.hot_score || "-"} / 5</span>
              </div>
              <p>${item.hot_label || "Sem leitura"}</p>
              <p class="history-meta">${formatDate(item.created_at)} • ${item.product_type || "item"}</p>
            </article>
          `
        )
        .join("");

      return `
        <section class="history-group">
          <div class="history-group-header">
            <h3>${group.category}</h3>
            <span>${group.count}</span>
          </div>
          <div class="history-items">${items}</div>
        </section>
      `;
    })
    .join("");
}

async function loadHistory() {
  if (!historyStatusEl) return;

  historyStatusEl.textContent = "Carregando histórico...";

  try {
    const response = await fetch("/api/analyses");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error("Falha ao carregar histórico.");
    }

    if (!payload.ok) {
      if (payload.reason === "supabase_not_configured") {
        historyStatusEl.textContent = "Supabase ainda não configurado.";
      } else if (payload.reason === "supabase_table_missing") {
        historyStatusEl.textContent = "Falta criar a tabela de análises no Supabase.";
      } else {
        historyStatusEl.textContent = "Histórico indisponível no momento.";
      }
      renderHistoryGroups([]);
      return;
    }

    historyStatusEl.textContent = `${payload.items.length} análise(s) carregada(s).`;
    renderHistoryGroups(payload.grouped || []);
  } catch (error) {
    historyStatusEl.textContent = "Não foi possível carregar o histórico agora.";
    renderHistoryGroups([]);
  }
}

async function saveCurrentAnalysis() {
  if (!currentPayload || !currentResult || !saveStatusEl || !saveAnalysisButton) {
    return;
  }

  saveStatusEl.textContent = "Salvando análise...";
  saveAnalysisButton.disabled = true;

  try {
    const response = await fetch("/api/save-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: currentPayload,
        result: currentResult
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error("Falha ao salvar análise.");
    }

    if (payload.saved) {
      saveStatusEl.textContent = "Análise salva com sucesso.";
      loadHistory();
    } else if (payload.reason === "supabase_table_missing") {
      saveStatusEl.textContent = "Falta criar a tabela de análises no Supabase.";
    } else if (payload.reason === "supabase_not_configured") {
      saveStatusEl.textContent = "Supabase ainda não configurado.";
    } else {
      saveStatusEl.textContent = "Não foi possível salvar a análise agora.";
    }
  } catch (error) {
    saveStatusEl.textContent = "Não foi possível salvar a análise agora.";
  } finally {
    saveAnalysisButton.disabled = false;
  }
}

imageInput.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];
  if (!file) {
    imageDataUrl = "";
    preview.src = "";
    preview.classList.add("hidden");
    return;
  }

  imageDataUrl = await readFileAsDataUrl(file);
  preview.src = imageDataUrl;
  preview.classList.remove("hidden");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.imageDataUrl = imageDataUrl;
  currentPayload = payload;
  currentResult = null;

  statusEl.textContent = "Gerando título, descrição e nota...";
  if (saveStatusEl) {
    saveStatusEl.textContent = "Gere uma análise para liberar o salvamento.";
  }
  if (saveAnalysisButton) {
    saveAnalysisButton.disabled = true;
  }
  submitButtons.forEach((submitButton) => {
    submitButton.disabled = true;
  });

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Falha ao gerar a análise.");
    }

    const result = await response.json();
    currentResult = result;

    setText(suggestedTitleEl, result.suggestedTitle || "Sem título sugerido.");
    setText(descriptionEl, result.description || "Sem descrição sugerida.");
    setText(hotLabelEl, result.hotLabel || "Sem leitura de venda.");

    if (hotScoreEl) {
      hotScoreEl.textContent = result.hotScore || "-";
    }
    if (scoreBadgeEl) {
      scoreBadgeEl.classList.remove("hidden");
    }
    if (hotStarsEl) {
      hotStarsEl.textContent = renderStars(Number(result.hotScore) || 1);
      hotStarsEl.classList.remove("muted");
    }

    renderList(
      alternateTitlesEl,
      result.alternateTitles?.length ? result.alternateTitles : ["Sem variações suficientes."]
    );
    renderList(
      scoreReasonsEl,
      result.scoreReasons?.length ? result.scoreReasons : ["Sem observações."]
    );

    renderList(
      photoReviewEl,
      result.photoReview?.length ? result.photoReview : ["Sem observações."]
    );
    setText(instagramHookEl, result.instagramHook || "Sem gancho sugerido.");
    setText(instagramCaptionEl, result.instagramCaption || "Sem legenda sugerida.");
    setText(instagramCtaEl, result.instagramCta || "Sem chamada para ação sugerida.");

    renderList(
      instagramHashtagsEl,
      result.instagramHashtags?.length ? result.instagramHashtags : ["Sem hashtags sugeridas."]
    );

    renderList(
      instagramTipsEl,
      result.instagramTips?.length ? result.instagramTips : ["Sem observações."]
    );

    statusEl.textContent = "Análise gerada com sucesso.";
    if (saveStatusEl) {
      saveStatusEl.textContent = "Clique em salvar análise para guardar este resultado.";
    }
    if (saveAnalysisButton) {
      saveAnalysisButton.disabled = false;
    }
  } catch (error) {
    statusEl.textContent = "Não foi possível gerar a análise agora. Tente novamente.";
  } finally {
    submitButtons.forEach((submitButton) => {
      submitButton.disabled = false;
    });
  }
});

if (refreshHistoryButton) {
  refreshHistoryButton.addEventListener("click", loadHistory);
}

if (saveAnalysisButton) {
  saveAnalysisButton.addEventListener("click", saveCurrentAnalysis);
}

loadHistory();
