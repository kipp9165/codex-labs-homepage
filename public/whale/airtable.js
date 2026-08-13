async function sendToAirtable() {
  const lead = JSON.parse(localStorage.getItem("whale_lead") || "{}");

  await fetch("https://api.airtable.com/v0/YOUR_BASE_ID/WhaleLeads", {
    method: "POST",
    headers: {
      "Authorization": "******",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fields: {
        Name: lead.name,
        Email: lead.email,
        Message: lead.message,
        Timestamp: lead.timestamp
      }
    })
  });

  alert("Lead sent to Airtable.");
}
