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

  statusEl.textContent = "Gerando titulo, descricao e nota...";
  button.disabled = true;

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    suggestedTitleEl.textContent = result.suggestedTitle;
    suggestedTitleEl.classList.remove("muted");

    descriptionEl.textContent = result.description;
    descriptionEl.classList.remove("muted");

    hotLabelEl.textContent = result.hotLabel;
    hotLabelEl.classList.remove("muted");

    hotScoreEl.textContent = result.hotScore;
    scoreBadgeEl.classList.remove("hidden");

    renderList(
      alternateTitlesEl,
      result.alternateTitles?.length ? result.alternateTitles : ["Sem variacoes suficientes."]
    );
    alternateTitlesEl.classList.remove("muted");

    renderList(
      scoreReasonsEl,
      result.scoreReasons?.length ? result.scoreReasons : ["Sem observacoes."]
    );
    scoreReasonsEl.classList.remove("muted");

    renderList(
      photoReviewEl,
      result.photoReview?.length ? result.photoReview : ["Sem observacoes."]
    );
    photoReviewEl.classList.remove("muted");

    statusEl.textContent =
      result.source === "openai"
        ? "Analise feita com IA."
        : "Analise feita com modo local de fallback.";

    if (result.warning) {
      statusEl.textContent += ` ${result.warning}`;
    }
  } catch (error) {
    statusEl.textContent = "Nao foi possivel gerar o anuncio agora.";
  } finally {
    button.disabled = false;
  }
});
