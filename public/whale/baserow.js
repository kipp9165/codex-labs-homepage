async function sendToBaserow() {
  const lead = JSON.parse(localStorage.getItem("whale_lead") || "{}");

  await fetch("https://api.baserow.io/api/database/rows/table/788861/?user_field_names=true", {
    method: "POST",
    headers: {
      "Authorization": "Token YOUR_BASEROW_TOKEN",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      Name: lead.name,
      Email: lead.email,
      Message: lead.message,
      Timestamp: lead.timestamp
    })
  });

  alert("Lead sent to Baserow.");
}
