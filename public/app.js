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
const submitButtons = document.querySelectorAll(".primary-button");

let imageDataUrl = "";

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

  statusEl.textContent = "Gerando título, descrição e nota...";
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
  } catch (error) {
    statusEl.textContent = "Não foi possível gerar a análise agora. Tente novamente.";
  } finally {
    submitButtons.forEach((submitButton) => {
      submitButton.disabled = false;
    });
  }
});
