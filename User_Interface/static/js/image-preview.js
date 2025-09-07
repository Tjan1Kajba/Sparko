// Pošiljanje obrazca
function setupFormSubmission() {
  const uploadForm = document.getElementById("uploadForm");
  if (uploadForm) {
    uploadForm.addEventListener("submit", function () {
      const submitBtn = this.querySelector('button[type="submit"]');
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
      submitBtn.disabled = true;
      sessionStorage.setItem("isProcessing", "true");
    });
  }
}

//Ohranitev slike med osveževanjem strani
function handleImagePersistence() {
  const isProcessing = sessionStorage.getItem("isProcessing");
  if (isProcessing === "true") {
    restoreImageFromSession();
    sessionStorage.removeItem("isProcessing");
  } else {
    sessionStorage.removeItem("uploadedImageData");
    sessionStorage.removeItem("uploadedFileName");
  }
}

// Prikaže preview slike in shrani v session storage
function previewImage(file) {
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const fileIcon = document.getElementById("fileIcon");
      const dropText = document.getElementById("dropText");
      const imagePreview = document.getElementById("imagePreview");
      const previewImg = document.getElementById("previewImg");
      const processedFileInfo = document.getElementById("processedFileInfo");

      fileIcon.style.display = "none";
      dropText.style.display = "none";
      imagePreview.classList.remove("image-preview-hidden");
      if (processedFileInfo) {
        processedFileInfo.style.display = "none";
      }

      previewImg.src = e.target.result;
      sessionStorage.setItem("uploadedImageData", e.target.result);
      sessionStorage.setItem("uploadedFileName", file.name);
    };
    reader.readAsDataURL(file);
  }
}

function restoreImageFromSession() {
  const savedImageData = sessionStorage.getItem("uploadedImageData");
  const savedFileName = sessionStorage.getItem("uploadedFileName");
  if (savedImageData && savedFileName) {
    const fileIcon = document.getElementById("fileIcon");
    const dropText = document.getElementById("dropText");
    const imagePreview = document.getElementById("imagePreview");
    const previewImg = document.getElementById("previewImg");

    fileIcon.style.display = "none";
    dropText.style.display = "none";
    imagePreview.classList.remove("image-preview-hidden");
    previewImg.src = savedImageData;
    updateDropZoneText(savedFileName);
  }
}

function resetDropZone() {
  const fileIcon = document.getElementById("fileIcon");
  const dropText = document.getElementById("dropText");
  const imagePreview = document.getElementById("imagePreview");
  const processedFileInfo = document.getElementById("processedFileInfo");

  fileIcon.style.display = "block";
  dropText.style.display = "block";
  dropText.innerHTML =
    "<strong>Drag and drop your document here</strong><br />or click to select a file";
  imagePreview.classList.add("image-preview-hidden");
  if (processedFileInfo) {
    processedFileInfo.style.display = "block";
  }

  fileInput.value = "";
  sessionStorage.removeItem("uploadedImageData");
  sessionStorage.removeItem("uploadedFileName");
}
