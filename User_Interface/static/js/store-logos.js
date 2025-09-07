function getFallbackColors(storeName) {
  let hash = 0;
  for (let i = 0; i < storeName.length; i++) {
    hash = storeName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 60) % 360;
  const hue3 = (hue1 + 120) % 360;

  return {
    primary: `hsl(${hue1}, 70%, 50%)`,
    secondary: `hsl(${hue2}, 60%, 60%)`,
    tertiary: `hsl(${hue3}, 65%, 55%)`,
  };
}

function loadStoreLogo(imgElement, storeName) {
  if (
    !storeName ||
    storeName.toLowerCase() === "unknown store" ||
    storeName.toLowerCase() === "store"
  ) {
    return;
  }

  const receiptCard = imgElement.closest(".receipt-card");
  const cleanStoreName = storeName
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

  const clearbitUrl = `https://logo.clearbit.com/${cleanStoreName}.com`;

  imgElement.onload = function () {
    this.crossOrigin = "anonymous";
    setTimeout(() => {
      try {
        extractDominantColor(this, (primary, secondary, tertiary) => {
          updateAccentBar(receiptCard, primary, secondary, tertiary);
        });
      } catch (error) {
        const fallbackColors = getFallbackColors(storeName);
        updateAccentBar(
          receiptCard,
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
        const fallbackColors = getFallbackColors(storeName);
        updateAccentBar(
          receiptCard,
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

function initializeStoreLogos() {
  const storeLogos = document.querySelectorAll(".store-logo");
  storeLogos.forEach(function (img) {
    const storeName = img.getAttribute("data-store-name");
    loadStoreLogo(img, storeName);
  });
}
document.addEventListener("DOMContentLoaded", initializeStoreLogos);
