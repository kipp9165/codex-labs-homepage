const params = new URLSearchParams(window.location.search);

if (params.get("openStore") === "1") {
  window.location.replace("/store/index.html");
}
