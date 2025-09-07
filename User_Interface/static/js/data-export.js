/* Zbere vse podatke računa in jih shrani v MongoDB */
async function saveReceiptData() {
  let imageId = "";
  const imageIdInput = document.getElementById("receipt_image_id");
  if (imageIdInput && imageIdInput.value) {
    imageId = imageIdInput.value;
  } else if (sessionStorage.getItem("uploadedImageId")) {
    imageId = sessionStorage.getItem("uploadedImageId");
  }

  const data = {
    store_name: document.getElementById("store_name").value,
    store_addr: document.getElementById("store_addr").value,
    phone: document.getElementById("phone").value,
    date: window.normalizeDateToDDMMYYYY
      ? normalizeDateToDDMMYYYY(document.getElementById("date").value)
      : document.getElementById("date").value,
    time: document.getElementById("time").value,
    subtotal: document.getElementById("subtotal").value,
    svc: document.getElementById("svc").value,
    tax: document.getElementById("tax").value,
    total: document.getElementById("total").value,
    tips: document.getElementById("tips").value,
    discount: document.getElementById("discount").value,
    items: [],
    image_id: imageId,
  };

  const itemElements = document.querySelectorAll("#itemsList > div");
  itemElements.forEach((item) => {
    data.items.push({
      name: item.querySelector(".item-name").value,
      value: item.querySelector(".item-value").value,
      quantity: item.querySelector(".item-quantity").value,
    });
  });

  try {
    const response = await fetch("/save_receipt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      alert("Receipt saved successfully!");
    } else {
      alert("Failed to save receipt: " + result.message);
    }
  } catch (error) {
    alert("Error saving receipt. Please try again.");
  }
}

/** Izvoz podatkov računa v XML*/
function exportToXML() {
  let xml = "<s_receipt>\n";

  // Doda informacije računa
  xml += `  <s_store_name>${
    document.getElementById("store_name").value
  }</s_store_name>\n`;
  xml += `  <s_store_addr>${
    document.getElementById("store_addr").value
  }</s_store_addr>\n`;
  xml += `  <s_phone>${document.getElementById("phone").value}</s_phone>\n`;
  xml += `  <s_date>${
    window.normalizeDateToDDMMYYYY
      ? normalizeDateToDDMMYYYY(document.getElementById("date").value)
      : document.getElementById("date").value
  }</s_date>\n`;
  xml += `  <s_time>${document.getElementById("time").value}</s_time>\n`;
  xml += `  <s_subtotal>${
    document.getElementById("subtotal").value
  }</s_subtotal>\n`;
  xml += `  <s_svc>${document.getElementById("svc").value}</s_svc>\n`;
  xml += `  <s_tax>${document.getElementById("tax").value}</s_tax>\n`;
  xml += `  <s_total>${document.getElementById("total").value}</s_total>\n`;
  xml += `  <s_tips>${document.getElementById("tips").value}</s_tips>\n`;
  xml += `  <s_discount>${
    document.getElementById("discount").value
  }</s_discount>\n`;
  xml += "  <s_line_items>\n";
  const itemElements = document.querySelectorAll("#itemsList > div");
  itemElements.forEach((item) => {
    xml += `    <s_item_name>${
      item.querySelector(".item-name").value
    }</s_item_name>\n`;
    xml += `    <s_item_value>${
      item.querySelector(".item-value").value
    }</s_item_value>\n`;
    xml += `    <s_item_quantity>${
      item.querySelector(".item-quantity").value
    }</s_item_quantity>\n`;
    xml += "    <sep/>\n";
  });
  xml += "  </s_line_items>\n";
  xml += "</s_receipt>";

  // Prenos
  const blob = new Blob([xml], { type: "text/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "receipt_data.xml";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function resetForm() {
  if (confirm("Are you sure you want to reset all changes?")) {
    parseExtractedText();
  }
}
