//Izračuna vrednost davka na podlagi seštevkov računa in obravnava več vrednosti davka
function calculateTaxIfNeeded(
  taxValue,
  subtotalValue,
  totalValue,
  serviceValue = 0,
  tipsValue = 0,
  discountValue = 0
) {
  // Razčlenjevanje numeričnih vrednosti iz nizov
  const parseValue = (val) => {
    if (!val || val.trim() === "") return 0;
    const parsed = parseFloat(val.toString().replace(/[^\d.-]/g, ""));
    return isNaN(parsed) ? 0 : parsed;
  };

  // Izbira najbolj logične vrednosti davka iz več možnosti
  const selectLogicalTaxValue = (
    taxStr,
    subtotal,
    total,
    service,
    tips,
    discount
  ) => {
    if (!taxStr || taxStr.trim() === "") return "";

    const taxMatches = taxStr.match(/\d+[.,]\d+/g);
    if (!taxMatches || taxMatches.length <= 1) {
      return taxStr;
    }

    // Obdela vse najdene možnosti davka
    const taxOptions = taxMatches
      .map((match) => {
        const normalizedValue = match.replace(",", ".");
        return {
          originalText: match,
          value: parseFloat(normalizedValue),
          normalizedText: normalizedValue,
        };
      })
      .filter((option) => !isNaN(option.value));

    if (taxOptions.length === 0) return taxStr;

    // Izračun pričakovanega davka na podlagi seštevkov računa
    const expectedTax = total - subtotal - service - tips + discount;
    let bestOption = taxOptions[0];
    let smallestDifference = Math.abs(expectedTax - bestOption.value);

    // Najbolj ujemajoča vrednost davka
    for (let i = 1; i < taxOptions.length; i++) {
      const option = taxOptions[i];
      const difference = Math.abs(expectedTax - option.value);
      const isReasonableRate =
        option.value >= subtotal * 0.05 && option.value <= subtotal * 0.3;
      const currentIsReasonable =
        bestOption.value >= subtotal * 0.05 &&
        bestOption.value <= subtotal * 0.3;

      if (
        (isReasonableRate && !currentIsReasonable) ||
        (isReasonableRate === currentIsReasonable &&
          difference < smallestDifference)
      ) {
        bestOption = option;
        smallestDifference = difference;
      }
    }
    return bestOption.normalizedText;
  };

  // Razčlene vse vrednosti
  const subtotal = parseValue(subtotalValue);
  const total = parseValue(totalValue);
  const service = parseValue(serviceValue);
  const tips = parseValue(tipsValue);
  const discount = parseValue(discountValue);

  const selectedTaxValue = selectLogicalTaxValue(
    taxValue,
    subtotal,
    total,
    service,
    tips,
    discount
  );
  const tax = parseValue(selectedTaxValue);

  // Preveri, ali je potreben izračun davka
  const isUnusualTax =
    tax <= 0.5 || !selectedTaxValue || selectedTaxValue.trim() === "";

  if (isUnusualTax && subtotal > 0 && total > 0) {
    const calculatedTax = total - subtotal - service - tips + discount;
    if (calculatedTax > 0 && calculatedTax <= subtotal * 0.5) {
      return calculatedTax.toFixed(2);
    }
  }

  return selectedTaxValue;
}

//12-urni casovni format v 24-urni format
function convertTo24HourFormat(time12h) {
  if (!time12h) return time12h;

  const timeStr = time12h.trim().toUpperCase();
  if (!timeStr.includes("AM") && !timeStr.includes("PM")) {
    return time12h;
  }

  const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/;
  const match = timeStr.match(timeRegex);

  if (!match) {
    return time12h;
  }

  let hours = parseInt(match[1]);
  const minutes = match[2];
  const seconds = match[3] || "00";
  const period = match[4];

  if (period === "AM") {
    if (hours === 12) {
      hours = 0;
    }
  } else {
    if (hours !== 12) {
      hours += 12;
    }
  }

  const formattedHours = hours.toString().padStart(2, "0");
  return `${formattedHours}:${minutes}:${seconds}`;
}
