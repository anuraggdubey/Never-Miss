// NeverMiss content script
// Detects emotional/special-occasion phrases in editable fields and shows a soft popup.

const PATTERNS = [
  { re: /happy birthday[, ]+([a-z]+)/i, occasion: "birthday" },
  { re: /happy anniversary[, ]+([a-z]+)/i, occasion: "anniversary" },
  { re: /congrats[, ]+([a-z]+)/i, occasion: "milestone" },
  { re: /congratulations[, ]+([a-z]+)/i, occasion: "milestone" },
  { re: /miss you[, ]+([a-z]+)/i, occasion: "memory" },
  { re: /proud of you[, ]+([a-z]+)/i, occasion: "milestone" },
  { re: /happy birthday ([a-z]+)/i, occasion: "birthday" },
];

function detect(text) {
  if (!text || text.length < 12) return null;
  for (const pattern of PATTERNS) {
    const match = text.match(pattern.re);
    if (match && match[1]) {
      return { name: match[1][0].toUpperCase() + match[1].slice(1), occasion: pattern.occasion };
    }
  }
  return null;
}

let lastPrompted = "";
let popup = null;

function showPopup(detected) {
  if (popup) popup.remove();
  popup = document.createElement("div");
  popup.className = "nm-popup";
  popup.innerHTML = `
    <div class="nm-card">
      <div class="nm-row">
        <div class="nm-icon">♡</div>
        <div class="nm-body">
          <div class="nm-eyebrow">NeverMiss noticed something sweet</div>
          <div class="nm-title">Remember <b>${detected.name}</b>'s ${detected.occasion} for next year?</div>
          <label style="display:block;margin-top:10px;">
            <span class="nm-eyebrow" style="display:block;margin-bottom:6px;">When is it?</span>
            <input class="nm-date" type="date" style="width:100%;padding:8px 10px;border-radius:12px;border:0;outline:none;background:#fff;color:#1a1530;" />
          </label>
        </div>
        <button class="nm-close" aria-label="close">×</button>
      </div>
      <div class="nm-actions">
        <button class="nm-btn nm-primary">Save the moment</button>
        <button class="nm-btn">Remind later</button>
        <button class="nm-btn nm-ghost">Not this time</button>
      </div>
    </div>`;
  document.body.appendChild(popup);
  requestAnimationFrame(() => popup.classList.add("nm-in"));

  const close = () => {
    if (popup) {
      popup.classList.remove("nm-in");
      setTimeout(() => popup && popup.remove(), 300);
      popup = null;
    }
  };

  popup.querySelector(".nm-close").onclick = close;
  popup.querySelector(".nm-ghost").onclick = close;
  const dateInput = popup.querySelector(".nm-date");
  popup.querySelector(".nm-primary").onclick = () => {
    if (!dateInput.value) {
      dateInput.focus();
      return;
    }

    chrome.runtime.sendMessage({
      type: "save_moment",
      payload: {
        ...detected,
        date: dateInput.value,
        source: location.hostname,
        savedAt: Date.now(),
      },
    });

    popup.querySelector(".nm-card").innerHTML = `
      <div class="nm-saved">
        <div class="nm-icon">✓</div>
        <div>
          <div class="nm-title">Saved.</div>
          <div class="nm-eyebrow">We'll gently remind you next year, the day before.</div>
        </div>
      </div>`;
    setTimeout(close, 2400);
  };
}

let scanTimer;

function scan(text) {
  const detected = detect(text);
  if (!detected) return;
  const key = `${detected.name}:${detected.occasion}`;
  if (key === lastPrompted) return;
  lastPrompted = key;
  showPopup(detected);
}

document.addEventListener("input", (event) => {
  const target = event.target;
  if (!target) return;

  let value = "";
  if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") value = target.value || "";
  else if (target.isContentEditable) value = target.innerText || "";

  if (!value) return;
  clearTimeout(scanTimer);
  scanTimer = setTimeout(() => scan(value), 350);
}, true);
