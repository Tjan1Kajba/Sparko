let currentReceiptId = null;
let isEditMode = false;
let currentReceiptData = null;

// Ponastavi modal ko je modal zaprt

function resetModalState() {
  isEditMode = false;
  currentReceiptId = null;
  currentReceiptData = null;
  setTimeout(() => {
    const editBtn = document.getElementById("modalEditBtn");
    const saveBtn = document.getElementById("modalSaveBtn");
    const cancelBtn = document.getElementById("modalCancelBtn");

    if (editBtn) editBtn.classList.remove("d-none");
    if (saveBtn) saveBtn.classList.add("d-none");
    if (cancelBtn) cancelBtn.classList.add("d-none");
  }, 100);
}

async function openReceiptModal(receiptId) {
  resetModalState();
  currentReceiptId = receiptId;
  const originalBodyOverflow = document.body.style.overflow;
  const originalBodyPaddingRight = document.body.style.paddingRight;

  const modal = new bootstrap.Modal(document.getElementById("receiptModal"), {
    backdrop: true,
    keyboard: true,
  });

  document.getElementById("modalContent").innerHTML = `
    <div class="loading-container">
      <div class="spinner-border text-warning" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="loading-text">Loading receipt details...</p>
    </div>
  `;

  document.body.style.overflow = "hidden";
  document.body.style.paddingRight = "0px";
  const modalElement = document.getElementById("receiptModal");
  const restoreBodyStyles = () => {
    document.body.style.overflow = originalBodyOverflow;
    document.body.style.paddingRight = originalBodyPaddingRight;
    resetModalState(); // Ponastavi urejanje in stanje modala
    modalElement.removeEventListener("hidden.bs.modal", restoreBodyStyles);
  };
  modalElement.addEventListener("hidden.bs.modal", restoreBodyStyles);
  modal.show();

  try {
    const response = await fetch(`/get_receipt/${receiptId}`);
    const receipt = await response.json();

    if (response.ok) {
      displayReceiptInModal(receipt);
    } else {
      document.getElementById("modalContent").innerHTML = `
        <div class="error-container">
          <span class="error-icon">❌</span>
          <h5 class="error-title">Error Loading Receipt</h5>
          <p class="error-message">${
            receipt.message || "Failed to load receipt details"
          }</p>
        </div>
      `;
    }
  } catch (error) {
    document.getElementById("modalContent").innerHTML = `
      <div class="error-container">
        <span class="error-icon">❌</span>
        <h5 class="error-title">Connection Error</h5>
        <p class="error-message">Failed to connect to server</p>
      </div>
    `;
  }
}

function displayReceiptInModal(receipt) {
  currentReceiptData = receipt;
  let imageSection = "";
  if (receipt.image_id) {
    imageSection = `
      <div class='mb-2'>
        <div class='text-center'>
          <img src='/image/${receipt.image_id}' alt='Receipt Image' style='max-width: 100%; max-height: 300px; border-radius: 12px; border: 2px solid #ffc107; cursor: pointer;' onclick="window.open('/image/${receipt.image_id}')" />
          <p class='mt-2 text-white-50 small'>Click image to view full size</p>
        </div>
      </div>
    `;
  }

  const content = `
      <div class="row g-4">
        <div class="col-lg-2 col-12" style="overflow: hidden; padding:0px !important;">
          <div class="card h-auto modal-card store-logo-card ">
            <div class="card-body text-center" style="overflow: hidden;padding:0px !important;">
      
              ${
                receipt.store_addr
                  ? `<div class="map-container" style="position:relative;">
                        <div class="map-spinner-overlay" style="position:absolute;top:0;left:0;width:100%;height:180px;display:flex;align-items:center;justify-content:center;background:rgba(34,34,34,0.7);z-index:2;">
                          <div class="spinner-border text-warning" role="status" style="width:2.5rem;height:2.5rem;">
                            <span class="visually-hidden">Loading map...</span>
                          </div>
                        </div>
                        <iframe
                          width="100%"
                          height="180px"
                          style="border:0; border-radius: 0px; color: font-size: 0px !important; border-top-left-radius: 8px; border-top-right-radius: 8px;"
                          loading="lazy"
                          allowfullscreen
                          referrerpolicy="no-referrer-when-downgrade"
                          src="https://www.google.com/maps?q=${encodeURIComponent(
                            receipt.store_addr
                          )}&output=embed&ui=0&ui-components=0"
                          onload="this.previousElementSibling && (this.previousElementSibling.style.display='none')"
                        ></iframe>
                      </div>`
                  : ""
              }

              ${
                receipt.image_id
                  ? `
              <div class='mt-3 text-center' style="padding:0rem 1rem !important;">
                <img src='/image/${receipt.image_id}' alt='Receipt Thumbnail' style='max-width: 100%; max-height: 100%; object-fit: cover; border-radius: 8px; border: 2px solid #ffc107; cursor: pointer; background: #222;' onclick="window.open('/image/${receipt.image_id}')" />
                <p class='mt-2 text-white-50 small'>Click to view full image</p>
              </div>
              `
                  : ""
              }
            </div>
          </div>
        </div>
        <div class="col-lg-5 col-12">
          <div class="card h-auto modal-card store-info-card mb-4">
            <div class="card-body">
              <div class="d-flex align-items-center ">
                <div class="store-icon me-3" style="
                  background: transparent;
                  width: 96px;
                  height: 96px;
                  border-radius: 18px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  overflow: hidden !important;
                  position: relative;
                ">
                  <img 
                    class="store-logo-modal"
                    data-store-name="${receipt.store_name || "store"}"
                    style="
                      max-width: 100%;
                      max-height: 100%;
                      object-fit: contain;
                      border-radius: 18px;
                    "
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                  />
                  <span style="font-size: 36px; display: none; color: white;">🏪</span>
                </div>
                <div class="flex-grow-1">
                  <h4 class="text-white mb-2 fw-bold store-name">${
                    receipt.store_name || "Unknown Store"
                  }</h4>
                  <p class="text-light mb-0 store-address">
                    <span class="material-icons me-2">place</span>
                    ${receipt.store_addr || "No address available"}
                  </p>
                  ${
                    receipt.phone
                      ? `
                  <p class="text-light mb-0 mt-1 store-phone">
                    <span class="material-icons me-2">phone</span>
                    ${receipt.phone}
                  </p>
                  `
                      : ""
                  }
                </div>
              </div>
            </div>
          </div>
          <div class="card h-auto modal-card purchase-details-card">
            <div class="card-body">
              <h5 class="text-warning section-title">
                <span class="material-icons me-2">receipt</span>
                Purchase Details
              </h5>
              <div class="row g-3">
                <div class="col-6">
                  <div class="detail-item">
                    <div class="detail-icon">
                      <span class="material-icons">calendar_today</span>
                    </div>
                    <div class="detail-content">
                      <small class="detail-label">Date</small>
                      <p class="detail-value">${receipt.date || "N/A"}</p>
                    </div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="detail-item">
                    <div class="detail-icon">
                      <span class="material-icons">access_time</span>
                    </div>
                    <div class="detail-content">
                      <small class="detail-label">Time</small>
                      <p class="detail-value">${receipt.time || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="financial-details">
                <div class="financial-row">
                  <div class="editable-field" data-field="subtotal">
                    <div class="display-mode">
                      <span class="financial-label">Subtotal</span>
                      <span class="financial-value">${formatPrice(
                        receipt.subtotal || 0,
                        receipt.currency || "€"
                      )}</span>
                    </div>
                    <div class="edit-mode d-none">
                      <label class="form-label financial-label">Subtotal</label>
                      <input type="text" class="form-control edit-input financial-input" value="${
                        stripCurrencyForEdit(receipt.subtotal) || ""
                      }" placeholder="0.00">
                    </div>
                  </div>
                </div>
                <div class="financial-row">
                  <div class="editable-field" data-field="tax">
                    <div class="display-mode">
                      <span class="financial-label">Tax</span>
                      <span class="financial-value">${formatPrice(
                        receipt.tax || 0,
                        receipt.currency || "€"
                      )}</span>
                    </div>
                    <div class="edit-mode d-none">
                      <label class="form-label financial-label">Tax</label>
                      <input type="text" class="form-control edit-input financial-input" value="${
                        stripCurrencyForEdit(receipt.tax) || ""
                      }" placeholder="0.00">
                    </div>
                  </div>
                </div>
                ${
                  receipt.svc || isEditMode
                    ? `
                <div class="financial-row">
                  <div class="editable-field" data-field="svc">
                    <div class="display-mode">
                      <span class="financial-label">Service</span>
                      <span class="financial-value">${formatPrice(
                        receipt.svc || 0,
                        receipt.currency || "€"
                      )}</span>
                    </div>
                    <div class="edit-mode d-none">
                      <label class="form-label financial-label">Service</label>
                      <input type="text" class="form-control edit-input financial-input" value="${
                        stripCurrencyForEdit(receipt.svc) || ""
                      }" placeholder="0.00">
                    </div>
                  </div>
                </div>
                `
                    : ""
                }
                ${
                  receipt.discount || isEditMode
                    ? `
                <div class="financial-row discount-row">
                  <div class="editable-field" data-field="discount">
                    <div class="display-mode">
                      <span class="financial-label">Discount</span>
                      <span class="financial-value">-${formatPrice(
                        receipt.discount || 0,
                        receipt.currency || "€"
                      )}</span>
                    </div>
                    <div class="edit-mode d-none">
                      <label class="form-label financial-label">Discount</label>
                      <input type="text" class="form-control edit-input financial-input" value="${
                        stripCurrencyForEdit(receipt.discount) || ""
                      }" placeholder="0.00">
                    </div>
                  </div>
                </div>
                `
                    : ""
                }
                ${
                  receipt.tips || isEditMode
                    ? `
                <div class="financial-row">
                  <div class="editable-field" data-field="tips">
                    <div class="display-mode">
                      <span class="financial-label">Tips</span>
                      <span class="financial-value">${formatPrice(
                        receipt.tips || 0,
                        receipt.currency || "€"
                      )}</span>
                    </div>
                    <div class="edit-mode d-none">
                      <label class="form-label financial-label">Tips</label>
                      <input type="text" class="form-control edit-input financial-input" value="${
                        stripCurrencyForEdit(receipt.tips) || ""
                      }" placeholder="0.00">
                    </div>
                  </div>
                </div>
                `
                    : ""
                }
                <div class="financial-row total-row">
                  <div class="editable-field" data-field="total">
                    <div class="display-mode">
                      <span class="financial-label total-label">Total</span>
                      <span class="financial-value total-value">${formatPrice(
                        receipt.total,
                        receipt.currency || "€"
                      )}</span>
                    </div>
                    <div class="edit-mode d-none">
                      <label class="form-label financial-label total-label">Total</label>
                      <input type="text" class="form-control edit-input financial-input" value="${
                        stripCurrencyForEdit(receipt.total) || ""
                      }" placeholder="0.00">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-5 col-12">
          <div class="card h-100 modal-card items-card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center ">
                <h5 class="text-warning mb-0 section-title">
                  <span class="material-icons me-2">shopping_bag</span>
                  Items (<span id="itemCount">${
                    receipt.items ? receipt.items.length : 0
                  }</span>)
                </h5>
                <button type="button" class="btn btn-sm btn-success edit-mode d-none" id="addItemBtn">
                  <span class="material-icons me-1">add</span>Add Item
                </button>
              </div>
              ${
                receipt.items && receipt.items.length > 0
                  ? `<div class="items-list-container" id="itemsList">
                  ${receipt.items
                    .map(
                      (item, index) => `
                    <div class="modern-item-row editable-item" data-item-index="${index}">
                      <div class="item-header">
                        <div class="item-number">
                          <span>${index + 1}</span>
                        </div>
                        <div class="item-name-section">
                          <div class="editable-field" data-field="name">
                            <div class="item-name display-mode">${
                              item.name || "Unnamed Item"
                            }</div>
                            <input type="text" class="form-control edit-input edit-mode d-none" value="${
                              item.name || ""
                            }" placeholder="Item Name">
                          </div>
                        </div>
                        <div class="item-actions edit-mode d-none">
                          <button type="button" class="btn btn-sm btn-danger delete-item-btn">
                            <span class="material-icons">delete</span>
                          </button>
                        </div>
                      </div>
                      <div class="item-details-row">
                        <div class="item-quantity-section">
                          <div class="editable-field" data-field="quantity">
                            <div class="quantity-display display-mode">
                              ${
                                item.quantity
                                  ? `
                              <span class="quantity-label">Quantity:</span>
                              <span class="quantity-value">${item.quantity}</span>
                              `
                                  : '<span class="quantity-placeholder">No quantity specified</span>'
                              }
                            </div>
                            <div class="quantity-edit edit-mode d-none">
                              <label class="form-label">Quantity</label>
                                <input type="text" class="form-control edit-input" value="${
                                  item.quantity || ""
                                }" placeholder="Enter quantity">
                            </div>
                          </div>
                        </div>
                        <div class="item-price-section">
                          <div class="editable-field" data-field="value">
                            <div class="price-display display-mode">
                              <span class="price-label">Price:</span>
                              <span class="price-value">${formatPrice(
                                item.value,
                                receipt.currency || "€"
                              )}</span>
                            </div>
                            <div class="price-edit edit-mode d-none">
                              <label class="form-label">Price</label>
                                <input type="text" class="form-control edit-input financial-input" value="${
                                  stripCurrencyForEdit(item.value) || ""
                                }" placeholder="0.00">
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>`
                  : `<div class="empty-state-modern" id="emptyState">
                  <div class="empty-icon-container">
                    <span class="material-icons empty-icon">shopping_bag</span>
                  </div>
                  <h6 class="empty-title">No Items Found</h6>
                  <p class="empty-message">This receipt doesn't contain any itemized purchases.</p>
                </div>
                <div class="items-list-container d-none" id="itemsList"></div>`
              }
            
            </div>
          </div>
        </div>

      
      ${
        receipt.ocr_text
          ? `
      <div class="col-12">
        <div class="card modal-card ocr-card">
          <div class="card-body">
            <h5 class="text-warning mb-3 section-title">
              <span class="material-icons me-2">description</span>
              Raw OCR Text
            </h5>
            <div class="ocr-text-container">
              <pre class="text-light mb-0 ocr-text">${receipt.ocr_text}</pre>
            </div>
          </div>
        </div>
      </div>
      `
          : ""
      }
    </div>
  `;

  document.getElementById("modalContent").innerHTML = content;
  resetUIToViewMode();

  // Naloži logotip trgovine po vstavljeni vsebini
  const modalStoreLogo = document.querySelector(".store-logo-modal");
  if (modalStoreLogo) {
    const storeName = modalStoreLogo.getAttribute("data-store-name");
    loadStoreLogo(modalStoreLogo, storeName);
  }
}

function resetUIToViewMode() {
  const editBtn = document.getElementById("modalEditBtn");
  const saveBtn = document.getElementById("modalSaveBtn");
  const cancelBtn = document.getElementById("modalCancelBtn");

  if (editBtn) editBtn.classList.remove("d-none");
  if (saveBtn) saveBtn.classList.add("d-none");
  if (cancelBtn) cancelBtn.classList.add("d-none");

  document
    .querySelectorAll(".display-mode")
    .forEach((el) => el.classList.remove("d-none"));
  document
    .querySelectorAll(".edit-mode")
    .forEach((el) => el.classList.add("d-none"));
}

function loadStoreLogo(imgElement, storeName) {
  if (
    !storeName ||
    storeName.toLowerCase() === "unknown store" ||
    storeName.toLowerCase() === "store"
  ) {
    return;
  }

  const modalContent = imgElement.closest(".modal-content");

  // Očisti ime trgovine za boljše rezultate API-ja
  const cleanStoreName = storeName
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
  const clearbitUrl = `https://logo.clearbit.com/${cleanStoreName}.com`;

  imgElement.onload = function () {
    this.crossOrigin = "anonymous";
    setTimeout(() => {
      try {
        extractDominantColorModal(this, (primary, secondary, tertiary) => {
          updateModalColors(modalContent, primary, secondary, tertiary);
        });
      } catch (error) {
        const fallbackColors = getFallbackColorsModal();
        updateModalColors(
          modalContent,
          fallbackColors.primary,
          fallbackColors.secondary,
          fallbackColors.tertiary
        );
      }
    }, 200);
  };
  imgElement.crossOrigin = "anonymous";
  imgElement.src = clearbitUrl;
  imgElement.onerror = function () {
    const commonDomains = ["com", "net", "org"];
    let currentDomainIndex = 0;

    const tryNextDomain = () => {
      if (currentDomainIndex < commonDomains.length) {
        const domain = commonDomains[currentDomainIndex];
        this.crossOrigin = "anonymous";
        this.src = `https://logo.clearbit.com/${cleanStoreName}.${domain}`;
        currentDomainIndex++;
      } else {
        this.style.display = "none";
        this.nextElementSibling.style.display = "flex";
        const fallbackColors = getFallbackColorsModal();
        updateModalColors(
          modalContent,
          fallbackColors.primary,
          fallbackColors.secondary,
          fallbackColors.tertiary
        );
      }
    };

    this.onerror = tryNextDomain;
    tryNextDomain();
  };
}

function formatPrice(price, currency = "€") {
  if (!price) return `0.00${currency}`;
  const priceStr = price.toString();
  if (
    priceStr.startsWith("$") ||
    priceStr.startsWith("€") ||
    priceStr.startsWith("£") ||
    priceStr.startsWith("¥")
  ) {
    const symbol = priceStr.charAt(0);
    const amount = priceStr.slice(1);
    return `${amount}${symbol}`;
  }
  return `${priceStr}${currency}`;
}

function stripCurrencyForEdit(value) {
  if (!value) return "";
  const valueStr = value.toString();
  if (
    valueStr.startsWith("$") ||
    valueStr.startsWith("€") ||
    valueStr.startsWith("£") ||
    valueStr.startsWith("¥")
  ) {
    return valueStr.slice(1);
  }
  if (
    valueStr.endsWith("$") ||
    valueStr.endsWith("€") ||
    valueStr.endsWith("£") ||
    valueStr.endsWith("¥")
  ) {
    return valueStr.slice(0, -1);
  }
  return valueStr;
}

function extractDominantColorModal(img, callback) {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = img.naturalWidth || img.width || 100;
    canvas.height = img.naturalHeight || img.height || 100;

    try {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } catch (corsError) {
      throw corsError;
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const colorMap = {};
    const step = 8;

    for (let i = 0; i < data.length; i += step * 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (
        a < 200 ||
        (r > 245 && g > 245 && b > 245) ||
        (r < 20 && g < 20 && b < 20)
      ) {
        continue;
      }

      const rRound = Math.round(r / 15) * 15;
      const gRound = Math.round(g / 15) * 15;
      const bRound = Math.round(b / 15) * 15;

      const key = `${rRound},${gRound},${bRound}`;
      colorMap[key] = (colorMap[key] || 0) + 1;
    }

    let maxCount = 0;
    let dominantColor = null;

    for (const [color, count] of Object.entries(colorMap)) {
      if (count > maxCount) {
        maxCount = count;
        dominantColor = color;
      }
    }

    if (dominantColor && maxCount > 5) {
      const [r, g, b] = dominantColor.split(",").map(Number);

      const primaryColor = `rgb(${r}, ${g}, ${b})`;
      const secondaryColor = `rgb(${Math.min(
        255,
        Math.max(0, r + 40)
      )}, ${Math.min(255, Math.max(0, g + 30))}, ${Math.min(
        255,
        Math.max(0, b + 30)
      )})`;
      const tertiaryColor = `rgb(${Math.min(
        255,
        Math.max(0, r - 30)
      )}, ${Math.min(255, Math.max(0, g - 20))}, ${Math.min(
        255,
        Math.max(0, b - 40)
      )})`;

      callback(primaryColor, secondaryColor, tertiaryColor);
    } else {
      throw new Error("No dominant color found");
    }
  } catch (error) {
    callback("#ffc107", "#ff6b35", "#f72585");
  }
}

function updateModalColors(
  modalContent,
  primaryColor,
  secondaryColor,
  tertiaryColor
) {
  if (!modalContent) return;

  const storeIcon = modalContent.querySelector(".store-icon");
  if (storeIcon) {
    const iconGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
    storeIcon.style.background = iconGradient;
  }
}

function getFallbackColorsModal() {
  return {
    primary: "white",
    secondary: "white",
    tertiary: "white",
  };
}

// Funkcije za urejanje
function toggleEditMode() {
  isEditMode = !isEditMode;

  const editBtn = document.getElementById("modalEditBtn");
  const saveBtn = document.getElementById("modalSaveBtn");
  const cancelBtn = document.getElementById("modalCancelBtn");

  if (isEditMode) {
    editBtn.classList.add("d-none");
    saveBtn.classList.remove("d-none");
    cancelBtn.classList.remove("d-none");

    document
      .querySelectorAll(".display-mode")
      .forEach((el) => el.classList.add("d-none"));
    document
      .querySelectorAll(".edit-mode")
      .forEach((el) => el.classList.remove("d-none"));

    document.querySelectorAll("input").forEach((input) => {
      input.readOnly = false;
      input.disabled = false;
    });

    addEditEventListeners();
  } else {
    editBtn.classList.remove("d-none");
    saveBtn.classList.add("d-none");
    cancelBtn.classList.add("d-none");

    document
      .querySelectorAll(".display-mode")
      .forEach((el) => el.classList.remove("d-none"));
    document
      .querySelectorAll(".edit-mode")
      .forEach((el) => el.classList.add("d-none"));
  }
}

function addEditEventListeners() {
  const addItemBtn = document.getElementById("addItemBtn");
  if (addItemBtn) {
    addItemBtn.addEventListener("click", addNewItem);
  }

  document.querySelectorAll(".delete-item-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const itemRow = this.closest(".editable-item");
      deleteItem(itemRow); // Izbriši artikel
    });
  });
}

function addNewItem() {
  const itemsList = document.getElementById("itemsList");
  const emptyState = document.getElementById("emptyState");
  const itemCount = document.getElementById("itemCount");

  if (emptyState && !emptyState.classList.contains("d-none")) {
    emptyState.classList.add("d-none");
    itemsList.classList.remove("d-none");
  }

  const currentItems = itemsList.querySelectorAll(".editable-item").length;
  const newIndex = currentItems;

  const newItemHTML = `
    <div class="modern-item-row editable-item" data-item-index="${newIndex}">
      <div class="item-header">
        <div class="item-number">
          <span>${newIndex + 1}</span>
        </div>
        <div class="item-name-section">
          <div class="editable-field" data-field="name">
            <div class="item-name display-mode d-none">New Item</div>
            <div class="edit-mode">
                <input type="text" class="form-control edit-input" value="" placeholder="Enter item name">
            </div>
          </div>
        </div>
        <div class="item-actions">
          <button type="button" class="btn btn-sm btn-danger delete-item-btn edit-mode">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
      <div class="item-details-row">
        <div class="item-quantity-section">
          <div class="editable-field" data-field="quantity">
            <div class="quantity-display display-mode d-none">
              <span class="quantity-label">QUANTITY</span>
              <span class="quantity-value">1</span>
            </div>
            <div class="quantity-edit edit-mode">
              <label class="form-label">QUANTITY</label>
                <input type="text" class="form-control edit-input" value="1" placeholder="1">
            </div>
          </div>
        </div>
        <div class="item-price-section">
          <div class="editable-field" data-field="value">
            <div class="price-display display-mode d-none">
              <span class="price-label">PRICE</span>
              <span class="price-value">0.00€</span>
            </div>
            <div class="price-edit edit-mode">
              <label class="form-label">PRICE</label>
                <input type="text" class="form-control edit-input financial-input" value="" placeholder="0.00">
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  itemsList.insertAdjacentHTML("beforeend", newItemHTML);

  itemCount.textContent = newIndex + 1;

  updateItemNumbers();

  const newItem = itemsList.lastElementChild;
  const deleteBtn = newItem.querySelector(".delete-item-btn");
  deleteBtn.addEventListener("click", function () {
    deleteItem(newItem);
  });

  const newInputs = newItem.querySelectorAll("input");
  newInputs.forEach((input, index) => {
    input.addEventListener("input", function () {});
  });

  const nameInput =
    newItem.querySelector('[data-field="name"] input') ||
    newItem.querySelector('input[placeholder="Enter item name"]');
  if (nameInput) {
    nameInput.focus();
  }
}

function deleteItem(itemRow) {
  const itemsList = document.getElementById("itemsList");
  const emptyState = document.getElementById("emptyState");
  const itemCount = document.getElementById("itemCount");

  itemRow.remove();
  updateItemNumbers();

  const remainingItems = itemsList.querySelectorAll(".editable-item").length;
  itemCount.textContent = remainingItems;

  if (remainingItems === 0 && isEditMode) {
    emptyState.classList.remove("d-none");
    itemsList.classList.add("d-none");
  }
}

function updateItemNumbers() {
  const items = document.querySelectorAll(".editable-item");
  items.forEach((item, index) => {
    item.dataset.itemIndex = index;
    const numberSpan = item.querySelector(".item-number span");
    if (numberSpan) {
      numberSpan.textContent = index + 1;
    }
  });
}

async function saveChanges() {
  try {
    const updatedData = { ...currentReceiptData };
    const subtotalInput = document.querySelector(
      '[data-field="subtotal"] input'
    );
    const taxInput = document.querySelector('[data-field="tax"] input');
    const svcInput = document.querySelector('[data-field="svc"] input');
    const discountInput = document.querySelector(
      '[data-field="discount"] input'
    );
    const tipsInput = document.querySelector('[data-field="tips"] input');
    const totalInput = document.querySelector('[data-field="total"] input');

    if (subtotalInput) updatedData.subtotal = subtotalInput.value;
    if (taxInput) updatedData.tax = taxInput.value;
    if (svcInput) updatedData.svc = svcInput.value;
    if (discountInput) updatedData.discount = discountInput.value;
    if (tipsInput) updatedData.tips = tipsInput.value;
    if (totalInput) updatedData.total = totalInput.value;

    updatedData.items = [];
    document.querySelectorAll(".editable-item").forEach((item) => {
      const nameInput =
        item.querySelector('[data-field="name"] input') ||
        item.querySelector(".item-name-section input") ||
        item.querySelector('input[placeholder="Item Name"]') ||
        item.querySelector('input[placeholder="Enter item name"]');

      const quantityInput =
        item.querySelector('[data-field="quantity"] input') ||
        item.querySelector(".quantity-edit input") ||
        item.querySelector('input[placeholder="Enter quantity"]') ||
        item.querySelector('input[placeholder="1"]');

      const valueInput =
        item.querySelector('[data-field="value"] input') ||
        item.querySelector(".price-edit input") ||
        item.querySelector('input[placeholder="0.00"]');

      const name = nameInput ? nameInput.value : "";
      const quantity = quantityInput ? quantityInput.value : "";
      const value = valueInput ? valueInput.value : "";

      if (name || quantity || value) {
        updatedData.items.push({
          name: name,
          quantity: quantity,
          value: value,
        }); // Dodaj artikel v seznam
      }
    });

    // Pošlji zahtevo za posodobitev na FastAPI
    const response = await fetch(`/update_receipt/${currentReceiptId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        currentReceiptData = { ...currentReceiptData, ...updatedData };
        displayReceiptInModal(currentReceiptData);

        if (isEditMode) {
          isEditMode = false;

          const editBtn = document.getElementById("modalEditBtn");
          const saveBtn = document.getElementById("modalSaveBtn");
          const cancelBtn = document.getElementById("modalCancelBtn");
          editBtn.classList.remove("d-none");
          saveBtn.classList.add("d-none");
          cancelBtn.classList.add("d-none");

          document
            .querySelectorAll(".display-mode")
            .forEach((el) => el.classList.remove("d-none"));
          document
            .querySelectorAll(".edit-mode")
            .forEach((el) => el.classList.add("d-none"));
        }

        showToast("Receipt updated successfully!", "success");
      } else {
        showToast(result.message || "Posodobitev računa ni uspela", "error");
      }
    } else {
      showToast("Posodobitev računa ni uspela", "error");
    }
  } catch (error) {
    showToast("Napaka pri shranjevanju sprememb", "error");
  }
}

function cancelEdit() {
  displayReceiptInModal(currentReceiptData);
  if (isEditMode) {
    isEditMode = false;

    const editBtn = document.getElementById("modalEditBtn");
    const saveBtn = document.getElementById("modalSaveBtn");
    const cancelBtn = document.getElementById("modalCancelBtn");

    editBtn.classList.remove("d-none");
    saveBtn.classList.add("d-none");
    cancelBtn.classList.add("d-none");

    document
      .querySelectorAll(".display-mode")
      .forEach((el) => el.classList.remove("d-none"));
    document
      .querySelectorAll(".edit-mode")
      .forEach((el) => el.classList.add("d-none"));
  }
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `alert alert-${
    type === "success" ? "success" : type === "error" ? "danger" : "info"
  } toast-notification`;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    min-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;
  toast.innerHTML = `
    <div class="d-flex align-items-center">
      <span class="material-icons me-2">${
        type === "success"
          ? "check_circle"
          : type === "error"
          ? "error"
          : "info"
      }</span>
      ${message}
      <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 5000);
}
window.openReceiptModal = openReceiptModal;

document.addEventListener("DOMContentLoaded", function () {
  const modalEditBtn = document.getElementById("modalEditBtn");
  const modalSaveBtn = document.getElementById("modalSaveBtn");
  const modalCancelBtn = document.getElementById("modalCancelBtn");

  if (modalEditBtn) {
    modalEditBtn.addEventListener("click", toggleEditMode);
  }

  if (modalSaveBtn) {
    modalSaveBtn.addEventListener("click", saveChanges);
  }

  if (modalCancelBtn) {
    modalCancelBtn.addEventListener("click", cancelEdit);
  }

  const modal = document.getElementById("receiptModal");
  if (modal) {
    modal.addEventListener("show.bs.modal", function () {
      document.body.style.paddingRight = "0px";
      document.body.classList.add("modal-open");
      isEditMode = false;
    });

    modal.addEventListener("hide.bs.modal", function () {
      document.body.style.paddingRight = "";
      document.body.classList.remove("modal-open");

      isEditMode = false;
    });
  }
});
