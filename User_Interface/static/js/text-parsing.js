/* Analizira izvlečeno besedilo iz Donut in vnese polja obrazca */
function parseExtractedText(rawTextInput) {
  let rawText = rawTextInput;
  if (!rawText) {
    const rawTextElement = document.querySelector("#rawTextCollapse div");
    if (!rawTextElement) return;
    rawText = rawTextElement.textContent;
    if (!rawText) return;
  }

  function extractTag(tag, str) {
    const start = str.indexOf(`<${tag}>`);
    const end = str.indexOf(`</${tag}>`);
    if (start === -1 || end === -1) return "";
    return str.substring(start + tag.length + 2, end).trim();
  }

  document.getElementById("store_name").value = extractTag(
    "s_store_name",
    rawText
  );
  document.getElementById("store_addr").value = extractTag(
    "s_store_addr",
    rawText
  );
  document.getElementById("phone").value = extractTag("s_phone", rawText);
  document.getElementById("date").value = extractTag("s_date", rawText);
  document.getElementById("time").value = extractTag("s_time", rawText);
  document.getElementById("subtotal").value = parseCurrencyValue(
    extractTag("s_subtotal", rawText)
  );
  document.getElementById("svc").value = parseCurrencyValue(
    extractTag("s_svc", rawText)
  );
  document.getElementById("tax").value = parseCurrencyValue(
    extractTag("s_tax", rawText)
  );
  document.getElementById("total").value = parseCurrencyValue(
    extractTag("s_total", rawText)
  );
  document.getElementById("tips").value = parseCurrencyValue(
    extractTag("s_tips", rawText)
  );
  document.getElementById("discount").value = parseCurrencyValue(
    extractTag("s_discount", rawText)
  );

  const itemsRaw = extractTag("s_line_items", rawText);
  const itemsList = document.getElementById("itemsList");
  itemsList.innerHTML = "";
  window.itemCounter = 0;
  if (itemsRaw) {
    // Razdeli glede <sep/> <sep />
    const itemBlocks = itemsRaw.split(/<sep\s*\/?>(?:\r?\n)?/);
    itemBlocks.forEach((block) => {
      if (!block || block.trim() === "") return;
      const name = extractTag("s_item_name", block);
      const value = parseCurrencyValue(extractTag("s_item_value", block));
      const quantity = parseCurrencyValue(extractTag("s_item_quantity", block));
      if (name || value || quantity) {
        addNewItem(name, value, quantity);
      }
    });
  }

  function detectCurrency(values) {
    const currencySymbols = ["€", "$", "£", "¥"];
    for (const value of values) {
      if (!value) continue;
      for (const symbol of currencySymbols) {
        if (value.startsWith(symbol) || value.endsWith(symbol)) {
          return symbol;
        }
      }
    }
    return null;
  }
  const detectedCurrency = detectCurrency([
    extractTag("s_subtotal", rawText),
    extractTag("s_svc", rawText),
    extractTag("s_tax", rawText),
    extractTag("s_total", rawText),
    extractTag("s_tips", rawText),
    extractTag("s_discount", rawText),
  ]);
  const currencyField = document.getElementById("currency");
  const currencyHelp =
    currencyField.parentElement.parentElement.querySelector("small");
  if (detectedCurrency) {
    currencyField.value = detectedCurrency;
    currencyField.removeAttribute("required");
    currencyField.style.borderColor = "rgba(40, 167, 69, 0.6)";
    currencyField.style.backgroundColor = "rgba(40, 167, 69, 0.1)";
    if (currencyHelp) {
      currencyHelp.textContent = `✅ Currency auto-detected: ${detectedCurrency}`;
      currencyHelp.style.color = "#28a745";
    }
  } else {
    currencyField.value = "€";
    currencyField.setAttribute("required", "required");
    currencyField.style.borderColor = "rgba(255, 193, 7, 0.6)";
    currencyField.style.backgroundColor = "rgba(255, 193, 7, 0.1)";
    if (currencyHelp) {
      currencyHelp.textContent =
        "⚠️ Currency set to € (default) - please verify and change if needed";
      currencyHelp.style.color = "#ffc107";
    }
  }
}

window.parseRawReceiptString = function (rawText) {
  parseExtractedText(rawText);
};
