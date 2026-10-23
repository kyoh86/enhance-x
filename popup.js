"use strict";

const status = document.getElementById("status");
const inputs = [...document.querySelectorAll('input[type="checkbox"]')];

chrome.storage.local.get(ENHANCE_X_DEFAULTS).then((settings) => {
  for (const input of inputs) input.checked = settings[input.name];
  document.querySelectorAll("fieldset").forEach((fieldset) => { fieldset.disabled = false; });
  status.textContent = "変更は自動保存され、開いているXに反映されます。";
}).catch(() => {
  status.textContent = "設定を読み込めませんでした。開き直してください。";
});

for (const input of inputs) {
  input.addEventListener("change", async () => {
    input.disabled = true;
    try {
      await chrome.storage.local.set({ [input.name]: input.checked });
      status.textContent = "保存しました。";
    } catch {
      input.checked = !input.checked;
      status.textContent = "保存できませんでした。もう一度お試しください。";
    } finally {
      input.disabled = false;
    }
  });
}
