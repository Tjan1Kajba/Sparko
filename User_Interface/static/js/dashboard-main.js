let itemCounter = 0;
let dropZone, fileInput;

document.addEventListener("DOMContentLoaded", function () {
  initializeDashboard();
});

function initializeDashboard() {
  dropZone = document.getElementById("dropZone");
  fileInput = document.getElementById("document");

  if (dropZone && fileInput) {
    setupDragAndDrop();
  }

  setupFormSubmission();
  handleImagePersistence();

  setTimeout(() => {
    if (document.querySelector("#rawTextCollapse div")) {
      parseExtractedText();
    }
  }, 500);
}

// Slika racuna v modalnem oknu
function showImageModal(imageId) {
  const modal = new bootstrap.Modal(document.getElementById("imageModal"));
  const modalImage = document.getElementById("modalImage");
  modalImage.src = `/image/${imageId}`;
  modal.show();
}
