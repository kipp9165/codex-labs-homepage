import express from "express";
import { codexOSBoot, codexOSRuntime, codexOSDistribution, codexOSFinalize, codexOSComplete } from "./homepage_os_server.js";

const router = express.Router();

router.post("/status", async (req, res) => {
    const result = await codexOSBoot(req.body);
    res.json({ status: result.os_state });
});

router.post("/diagnostics", async (req, res) => {
    const result = await codexOSRuntime(req.body);
    res.json({ diagnostics: result.runtime_state });
});

router.post("/version", async (req, res) => {
    const result = await codexOSComplete(req.body);
    res.json({ version: result.version_seal });
});

router.post("/integrity", async (req, res) => {
    const result = await codexOSComplete(req.body);
    res.json({ integrity: result.integrity_envelope });
});

export default router;