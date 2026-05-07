const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const statusEl = document.getElementById("status");

function setStatus(message) {
  statusEl.textContent = message;
}

async function completeTokenLogin(token) {
  setStatus("Completing login...");

  try {
    const response = await fetch("/api/auth/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token })
    });
    const data = await response.json();

    if (data.ok && data.sessionId) {
      localStorage.setItem("sessionId", data.sessionId);
      window.location.href = "/public/portal.html";
      return;
    }

    setStatus("Login link is invalid or expired.");
  } catch {
    setStatus("Unable to complete login.");
  }
}

async function requestMagicLink(email) {
  setStatus("Sending magic link...");

  try {
    await fetch("/api/auth/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email })
    });
    setStatus("Check your email");
  } catch {
    setStatus("Unable to send magic link.");
  }
}

const token = new URLSearchParams(window.location.search).get("token");

if (token) {
  form.style.display = "none";
  completeTokenLogin(token);
} else {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    if (!email) {
      setStatus("Enter a valid email.");
      return;
    }

    await requestMagicLink(email);
  });
}
