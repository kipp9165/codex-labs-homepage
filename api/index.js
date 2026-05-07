import express from "express";
import cors from "cors";
import path from "path";

const app = express();

app.use(cors());
app.use("/console", express.static(path.resolve("console")));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Console server listening on port ${port}`);
});
