import express from "express";
import { listJobs, runJob } from "../ops/index.js";

const app = express();

app.use(express.json());

app.get("/api/ops/jobs", (req, res) => {
  try {
    return res.json({ ok: true, jobs: listJobs() });
  } catch (err) {
    console.error("ops_api_error", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
});

app.post("/api/ops/run", async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) {
      return res.status(400).json({ ok: false, error: "job_name_required" });
    }
    const result = await runJob(name);
    return res.json({ ok: result.ok, job: result });
  } catch (err) {
    console.error("ops_api_error", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
});

export default app;

if (process.env.PORT) {
  app.listen(process.env.PORT, () => {
    console.log("api_listening");
  });
}
