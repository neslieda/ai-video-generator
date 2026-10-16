require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const videoRoutes = require("./routes/video");

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use("/api", videoRoutes);

// --- Health check ---
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --- Global error handler ---
app.use((err, _req, res, _next) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`[server] AI Video Generator backend running on http://localhost:${PORT}`);
});
