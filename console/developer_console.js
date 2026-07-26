import { getOSStatus, getOSDiagnostics, getOSVersion, getOSIntegrity } from "../components/os/homepage_os_client.js";

const PUBLIC_API = {
    boot: "/api/v1/boot",
    runtime: "/api/v1/runtime",
    distribution: "/api/v1/distribution",
    finalize: "/api/v1/finalize",
    complete: "/api/v1/complete"
};

async function callPublicAPI(endpoint) {
    const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: {} })
    });
    return await res.json();
}

export async function renderDeveloperConsole() {
    document.getElementById("console-status").innerText =
        JSON.stringify(await getOSStatus(), null, 2);

    document.getElementById("console-diagnostics").innerText =
        JSON.stringify(await getOSDiagnostics(), null, 2);

    document.getElementById("console-version").innerText =
        JSON.stringify(await getOSVersion(), null, 2);

    document.getElementById("console-integrity").innerText =
        JSON.stringify(await getOSIntegrity(), null, 2);

    const apiList = document.getElementById("console-api-list");
    apiList.innerHTML = "";

    Object.entries(PUBLIC_API).forEach(([name, endpoint]) => {
        const btn = document.createElement("button");
        btn.innerText = name;
        btn.onclick = async () => {
            const result = await callPublicAPI(endpoint);
            document.getElementById("console-api-response").innerText =
                JSON.stringify(result, null, 2);
        };
        apiList.appendChild(btn);
    });
}

document.addEventListener("DOMContentLoaded", renderDeveloperConsole);