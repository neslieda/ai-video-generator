const express = require("express");
const path = require("path");
const { createJobDir, scheduleCleanup } = require("../utils/fileManager");
const { generateSceneDescriptions } = require("../services/openai");
const { generateVideoClip } = require("../services/pika");
const { generateNarration } = require("../services/elevenlabs");
const { mergeVideoAndAudio } = require("../services/ffmpeg");

const router = express.Router();

/**
 * POST /api/generate
 *
 * Accepts { prompt: string } and streams progress via Server-Sent Events.
 * Each step sends a JSON event; the final event includes the video URL.
 */
router.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  // --- Validation ---
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "Prompt is required." });
  }
  if (prompt.length > 500) {
    return res
      .status(400)
      .json({ error: "Prompt must be 500 characters or fewer." });
  }

  // --- Set up SSE headers ---
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // disable nginx buffering if proxied
  });

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let jobDir;

  try {
    // Create isolated temp directory for this job
    const job = await createJobDir();
    jobDir = job.jobDir;
    const jobId = job.jobId;

    // === Step 1: Generate scene descriptions ===
    sendEvent({ step: "script", status: "in_progress" });
    const { scenes, narrationScript } = await generateSceneDescriptions(
      prompt.trim()
    );
    sendEvent({ step: "script", status: "done", scenes, narrationScript });

    // === Step 2: Generate video clips for each scene ===
    sendEvent({ step: "video", status: "in_progress" });
    const clipPaths = await Promise.all(
      scenes.map((scene, i) => generateVideoClip(scene, i, jobDir))
    );
    sendEvent({ step: "video", status: "done", clipCount: clipPaths.length });

    // === Step 3: Generate narration audio ===
    sendEvent({ step: "audio", status: "in_progress" });
    const audioPath = await generateNarration(narrationScript, jobDir);
    sendEvent({ step: "audio", status: "done" });

    // === Step 4: Merge clips and audio into final video ===
    sendEvent({ step: "merge", status: "in_progress" });
    const finalPath = await mergeVideoAndAudio(clipPaths, audioPath, jobDir);
    sendEvent({ step: "merge", status: "done" });

    // Build the public URL for the final video
    const videoFilename = `${jobId}/final.mp4`;
    const videoUrl = `/api/video/${videoFilename}`;

    sendEvent({ step: "complete", videoUrl });

    // Schedule cleanup of temp files after 30 minutes
    scheduleCleanup(jobDir);
  } catch (err) {
    console.error("[generate] Error:", err);
    sendEvent({ step: "error", error: err.message || "An unknown error occurred." });
  } finally {
    res.end();
  }
});

/**
 * GET /api/video/:jobId/:filename
 *
 * Serve generated video files from the tmp directory.
 */
router.get("/video/:jobId/:filename", (req, res) => {
  const { jobId, filename } = req.params;

  // Sanitize: only allow alphanumeric/hyphens in jobId and simple filenames
  if (!/^[a-f0-9-]+$/.test(jobId) || !/^[a-zA-Z0-9_.-]+$/.test(filename)) {
    return res.status(400).json({ error: "Invalid path." });
  }

  const filePath = path.join(__dirname, "..", "tmp", jobId, filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: "Video not found." });
    }
  });
});

module.exports = router;
