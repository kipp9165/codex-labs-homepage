function exportWhaleCRM() {
  const crm = localStorage.getItem("whale_crm_event");
  const lead = localStorage.getItem("whale_lead");

  const blob = new Blob([crm + "\n\n" + lead], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "whale_crm_export.txt";
  a.click();
}
