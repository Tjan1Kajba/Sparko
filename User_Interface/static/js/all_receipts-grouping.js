// Groupinranje racunov za all_receipts
document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("group-toggle-btn");
  const receiptsContainer = document.getElementById("receipts-container");
  let grouped = false;
  let receipts = window.receiptsData || [];

  function renderReceipts() {
    receiptsContainer.innerHTML = "";
    if (!grouped) {
      receipts.forEach((receipt) => {
        receiptsContainer.appendChild(createReceiptCard(receipt));
      });
      return;
    }
    // Grupira po imenu trgovine po abc
    const groups = {};
    receipts.forEach((r) => {
      const store = r.store_name.trim();
      if (!groups[store]) groups[store] = [];
      groups[store].push(r);
    });
    const sortedStores = Object.keys(groups).sort();
    sortedStores.forEach((store) => {
      // Naslov grupe
      const heading = document.createElement("div");
      heading.className = "store-group-heading";
      heading.textContent = store;
      receiptsContainer.appendChild(heading);
      groups[store].forEach((receipt) => {
        receiptsContainer.appendChild(createReceiptCard(receipt));
      });
      const gap = document.createElement("div");
      gap.className = "store-group-gap";
      receiptsContainer.appendChild(gap);
    });
  }

  function createReceiptCard(receipt) {
    const card = document.createElement("div");
    card.className = "receipt-card";
    card.innerHTML = `<div class="store-name">${receipt.store_name}</div>`;
    return card;
  }

  if (toggleBtn && receiptsContainer) {
    toggleBtn.addEventListener("click", function () {
      grouped = !grouped;
      toggleBtn.textContent = grouped ? "Ungroup" : "Group by Store";
      renderReceipts();
    });
    renderReceipts();
  }
});
