document.addEventListener("DOMContentLoaded", function () {
  const receiptCards = document.querySelectorAll(".receipt-card");
  receiptCards.forEach((card) => {
    const img = card.querySelector("img");
    if (!img) return;
    card.style.visibility = "hidden";
    const applyColors = () => {
      extractDominantColor(img, (primary, secondary, tertiary) => {
        updateAccentBar(card, primary, secondary, tertiary);
        card.style.visibility = "visible";
      });
    };
    if (img.complete && img.naturalWidth !== 0) {
      applyColors();
    } else {
      img.addEventListener("load", applyColors, { once: true });
      img.addEventListener(
        "error",
        () => {
          card.style.visibility = "visible";
        },
        { once: true }
      );
    }
  });
});

function extractDominantColor(img, callback) {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.naturalWidth || img.width || 100;
    canvas.height = img.naturalHeight || img.height || 100;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
      callback("white", "white", "white");
    }
  } catch (error) {
    callback("white", "white", "white");
  }
}

function updateAccentBar(
  receiptCard,
  primaryColor,
  secondaryColor,
  tertiaryColor
) {
  const accentBar = receiptCard.querySelector(".accent-bar");
  const storeIcon = receiptCard.querySelector(".store-icon");
  const totalBadge = receiptCard.querySelector(".total-badge");
  if (accentBar) {
    const gradient = `linear-gradient(90deg, ${primaryColor}, ${secondaryColor}, ${tertiaryColor})`;
    accentBar.style.background = gradient;
  }
  if (storeIcon) {
    const iconGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
    storeIcon.style.background = iconGradient;
  }
  if (totalBadge) {
    const badgeGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
    totalBadge.style.background = badgeGradient;
  }
}
