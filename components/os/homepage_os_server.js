import {
    codex_os_boot,
    codex_os_shutdown
} from "../../codex_os/codex/os/os_api.js";

import {
    os_runtime,
    os_runtime_shutdown
} from "../../codex_os/codex/os/runtime_api.js";

import {
    os_distribution,
    os_distribution_shutdown
} from "../../codex_os/codex/os/distribution_api.js";

import {
    os_finalize,
    os_finalize_shutdown
} from "../../codex_os/codex/os/finalization_api.js";

import {
    os_complete,
    os_complete_shutdown
} from "../../codex_os/codex/os/completion_api.js";
import developerConsoleRoutes from "../../console/developer_console_routes.js";

export async function codexOSBoot(payload) {
    return codex_os_boot(payload);
}

export async function codexOSRuntime(payload) {
    return os_runtime(payload);
}

export async function codexOSDistribution(payload) {
    return os_distribution(payload);
}

export async function codexOSFinalize(payload) {
    return os_finalize(payload);
}

export async function codexOSComplete(payload) {
    return os_complete(payload);
}

if (typeof app !== "undefined") {
    app.use(developerConsoleRoutes);
}