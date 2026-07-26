export async function codexOSRequest(endpoint, payload = {}) {
    const url = `/codex_os/${endpoint}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    return await res.json();
}

export async function getOSStatus() {
    return codexOSRequest("status");
}

export async function getOSDiagnostics() {
    return codexOSRequest("diagnostics");
}

export async function getOSVersion() {
    return codexOSRequest("version");
}

export async function getOSIntegrity() {
    return codexOSRequest("integrity");
}