function setupDragAndDrop() {
  dropZone.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      updateDropZoneText(file.name);
      previewImage(file);
    }
  });

  // Prepreči privzeto vedenje pri vlečenju
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, unhighlight, false);
  });
  dropZone.addEventListener("drop", handleDrop, false);
}
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight(e) {
  dropZone.classList.add("dragover");
}
function unhighlight(e) {
  dropZone.classList.remove("dragover");
}

/* Obravnava dogodke spuščanja datotek */
function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  if (files.length > 0) {
    const file = files[0];
    fileInput.files = files;
    updateDropZoneText(file.name);
    previewImage(file);
  }
}

/*Ime slike*/
function updateDropZoneText(filename) {
  const dropText = dropZone.querySelector(".drop-text");
  dropText.innerHTML = `<strong>File selected:</strong><br>${filename}`;
}
