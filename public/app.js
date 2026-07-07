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
  element.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    element.appendChild(li);
  });
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

    suggestedTitleEl.textContent = result.suggestedTitle;
    suggestedTitleEl.classList.remove("muted");

    descriptionEl.textContent = result.description;
    descriptionEl.classList.remove("muted");

    hotLabelEl.textContent = result.hotLabel;
    hotLabelEl.classList.remove("muted");

    hotScoreEl.textContent = result.hotScore;
    scoreBadgeEl.classList.remove("hidden");
    hotStarsEl.textContent = renderStars(result.hotScore);
    hotStarsEl.classList.remove("muted");

    renderList(
      alternateTitlesEl,
      result.alternateTitles?.length ? result.alternateTitles : ["Sem variações suficientes."]
    );
    alternateTitlesEl.classList.remove("muted");

    renderList(
      scoreReasonsEl,
      result.scoreReasons?.length ? result.scoreReasons : ["Sem observações."]
    );
    scoreReasonsEl.classList.remove("muted");

    renderList(
      photoReviewEl,
      result.photoReview?.length ? result.photoReview : ["Sem observações."]
    );
    photoReviewEl.classList.remove("muted");

    instagramHookEl.textContent = result.instagramHook || "Sem gancho sugerido.";
    instagramHookEl.classList.remove("muted");

    instagramCaptionEl.textContent = result.instagramCaption || "Sem legenda sugerida.";
    instagramCaptionEl.classList.remove("muted");

    instagramCtaEl.textContent = result.instagramCta || "Sem chamada para ação sugerida.";
    instagramCtaEl.classList.remove("muted");

    renderList(
      instagramHashtagsEl,
      result.instagramHashtags?.length ? result.instagramHashtags : ["Sem hashtags sugeridas."]
    );
    instagramHashtagsEl.classList.remove("muted");

    renderList(
      instagramTipsEl,
      result.instagramTips?.length ? result.instagramTips : ["Sem observações."]
    );
    instagramTipsEl.classList.remove("muted");

    statusEl.textContent = "Análise gerada com sucesso.";
  } catch (error) {
    statusEl.textContent = "Não foi possível gerar a análise agora. Tente novamente.";
  } finally {
    submitButtons.forEach((submitButton) => {
      submitButton.disabled = false;
    });
  }
});
