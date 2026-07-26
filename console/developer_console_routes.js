import express from "express";
import path from "path";

const router = express.Router();

router.get("/developer-console", (req, res) => {
    res.sendFile(path.resolve("console/developer_console.html"));
});

export default router;