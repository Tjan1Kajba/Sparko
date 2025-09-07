//  Doda nov izdelek v seznam v obrazcu
window.itemCounter = window.itemCounter || 0;

function addNewItem(name = "", value = "", quantity = "") {
  window.itemCounter++;
  const itemsContainer = document.getElementById("itemsList");
  const itemDiv = document.createElement("div");
  itemDiv.className = "rounded p-3 mb-3";

  itemDiv.style.cssText = `
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
        border: 1px solid rgba(255, 193, 7, 0.3);
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    `;

  itemDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 style="color: #ffc107; margin: 0; font-size: 1.1rem; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">Item ${window.itemCounter}</h6>
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeItem(this)" 
                    style="
                        font-size: 0.9rem; 
                        padding: 8px 12px; 
                        border-radius: 12px; 
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        background: linear-gradient(145deg, rgba(220, 53, 69, 0.1) 0%, rgba(220, 53, 69, 0.05) 100%);
                        border: 1px solid rgba(220, 53, 69, 0.4);
                        color: #dc3545;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 2px 8px rgba(220, 53, 69, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                        position: relative;
                        overflow: hidden;
                    "
                    onmouseover="
                        this.style.background='linear-gradient(145deg, rgba(220, 53, 69, 0.9) 0%, rgba(220, 53, 69, 0.8) 100%)'; 
                        this.style.color='white'; 
                        this.style.transform='scale(1.05) translateY(-1px)';
                        this.style.boxShadow='0 6px 20px rgba(220, 53, 69, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                        this.style.borderColor='rgba(220, 53, 69, 0.6)';
                    "
                    onmouseout="
                        this.style.background='linear-gradient(145deg, rgba(220, 53, 69, 0.1) 0%, rgba(220, 53, 69, 0.05) 100%)'; 
                        this.style.color='#dc3545'; 
                        this.style.transform='scale(1) translateY(0)';
                        this.style.boxShadow='0 2px 8px rgba(220, 53, 69, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                        this.style.borderColor='rgba(220, 53, 69, 0.4)';
                    ">🗑️</button>
        </div>
        <div class="row g-2">
            <div class="col-md-7" style="text-align: left !important;">
                <label class="form-label" style="color: rgba(255, 255, 255, 0.9); font-size: 1rem; margin-bottom: 4px; font-weight: 500;">Product name:</label>
                <input type="text" class="form-control form-control-sm item-name" value="${name}" placeholder="Enter item name" 
                       style="background-color: rgba(255,255,255,0.12); border: 1px solid rgba(255,193,7,0.4); color: white; font-size: 0.9rem; padding: 8px 10px; border-radius: 6px; transition: all 0.2s ease;"
                       onfocus="this.style.borderColor='#ffc107'; this.style.boxShadow='0 0 0 2px rgba(255,193,7,0.2)'"
                       onblur="this.style.borderColor='rgba(255,193,7,0.4)'; this.style.boxShadow='none'">
            </div>
            <div class="col-md-3" style="text-align: left !important;">
                <label class="form-label" style="color: rgba(255, 255, 255, 0.9); font-size: 1rem; margin-bottom: 4px; font-weight: 500;">Price:</label>
                <input type="text" class="form-control form-control-sm item-value" value="${value}" placeholder="0.00" 
                       style="background-color: rgba(255,255,255,0.12); border: 1px solid rgba(255,193,7,0.4); color: white; font-size: 0.9rem; padding: 8px 10px; border-radius: 6px; transition: all 0.2s ease;"
                       onfocus="this.style.borderColor='#ffc107'; this.style.boxShadow='0 0 0 2px rgba(255,193,7,0.2)'"
                       onblur="this.style.borderColor='rgba(255,193,7,0.4)'; this.style.boxShadow='none'">
            </div>
            <div class="col-md-2" style="text-align: left !important;">
                <label class="form-label" style="color: rgba(255, 255, 255, 0.9); font-size: 1rem; margin-bottom: 4px; font-weight: 500;">Qty:</label>
                <input type="number" class="form-control form-control-sm item-quantity" value="${quantity}" placeholder="1" min="1" 
                       style="background-color: rgba(255,255,255,0.12); border: 1px solid rgba(255,193,7,0.4); color: white; font-size: 0.9rem; padding: 8px 10px; border-radius: 6px; transition: all 0.2s ease;"
                       onfocus="this.style.borderColor='#ffc107'; this.style.boxShadow='0 0 0 2px rgba(255,193,7,0.2)'"
                       onblur="this.style.borderColor='rgba(255,193,7,0.4)'; this.style.boxShadow='none'">
            </div>
        </div>
    `;

  itemsContainer.appendChild(itemDiv);
}

function removeItem(button) {
  button.closest("div.rounded").remove();
}
