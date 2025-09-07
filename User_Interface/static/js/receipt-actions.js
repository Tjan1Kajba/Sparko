// Izvoz in brisanja računov
async function exportReceiptToXML(receiptId) {
  try {
    const response = await fetch(`/export_receipt_xml/${receiptId}`);
    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt_${receiptId}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert("Failed to export receipt");
    }
  } catch (error) {
    alert("Error exporting receipt");
  }
}

async function deleteReceipt(receiptId) {
  if (
    confirm(
      "Are you sure you want to delete this receipt? This action cannot be undone."
    )
  ) {
    try {
      const response = await fetch(`/delete_receipt/${receiptId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        alert("Receipt deleted successfully");
        location.reload();
      } else {
        alert("Failed to delete receipt: " + result.message);
      }
    } catch (error) {
      alert("Error deleting receipt");
    }
  }
}
