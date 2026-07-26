import { getOSStatus, getOSDiagnostics, getOSVersion, getOSIntegrity } from "./homepage_os_client.js";

export async function renderOSPanel() {
    const status = await getOSStatus();
    const diagnostics = await getOSDiagnostics();
    const version = await getOSVersion();
    const integrity = await getOSIntegrity();

    document.getElementById("os-status").innerText = JSON.stringify(status, null, 2);
    document.getElementById("os-diagnostics").innerText = JSON.stringify(diagnostics, null, 2);
    document.getElementById("os-version").innerText = version.version;
    document.getElementById("os-integrity").innerText = integrity.integrity;
}

document.addEventListener("DOMContentLoaded", renderOSPanel);