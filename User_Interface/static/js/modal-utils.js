//Prepreči premik strani zaradi modala
function initializeModalOverrides() {
  const originalModal = bootstrap.Modal.prototype.show;
  bootstrap.Modal.prototype.show = function () {
    const body = document.body;
    const originalPadding = body.style.paddingRight;
    const originalOverflow = body.style.overflow;
    originalModal.call(this);
    body.style.paddingRight = "0px";
    body.style.overflow = "hidden";

    this._element.addEventListener(
      "hidden.bs.modal",
      function () {
        body.style.paddingRight = originalPadding;
        body.style.overflow = originalOverflow;
      },
      { once: true }
    );
  };
}
document.addEventListener("DOMContentLoaded", initializeModalOverrides);
