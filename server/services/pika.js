const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs/promises");
const { getTempFilePath } = require("../utils/fileManager");

const execAsync = promisify(exec);

// Color palette for mock scene clips
const SCENE_COLORS = [
  "0x1a1a2e", // dark navy
  "0x16213e", // deep blue
  "0x0f3460", // steel blue
  "0x533483", // purple
  "0xe94560", // coral red
];

/**
 * Generate a video clip for a single scene description.
 *
 * Uses Pika API if a key is set. Otherwise, falls back to generating
 * a colored placeholder clip with the scene text via FFmpeg.
 *
 * Returns the absolute path to the generated MP4 file.
 */
async function generateVideoClip(sceneDescription, index, jobDir) {
  const pikaKey = process.env.PIKA_API_KEY;

  if (pikaKey && pikaKey !== "your_pika_api_key_here") {
    return await generateWithPika(sceneDescription, index, jobDir, pikaKey);
  }

  return await generateMockClip(sceneDescription, index, jobDir);
}

/**
 * Placeholder for real Pika API integration.
 * When Pika's API becomes available, implement the HTTP call here.
 */
async function generateWithPika(sceneDescription, index, jobDir, apiKey) {
  // TODO: Replace with actual Pika API call when available.
  // Pika API typically accepts a text prompt and returns a video URL.
  // For now, fall back to mock.
  console.log(
    `[pika] API key present but Pika integration is a placeholder — using mock for scene ${index + 1}`
  );
  return await generateMockClip(sceneDescription, index, jobDir);
}

/**
 * Generate a mock video clip: a 4-second colored background with
 * the scene number overlaid, using FFmpeg.
 */
async function generateMockClip(sceneDescription, index, jobDir) {
  const outputPath = getTempFilePath(jobDir, `scene_${index}.mp4`);
  const color = SCENE_COLORS[index % SCENE_COLORS.length];

  // Simple colored clip — no drawtext filter needed (avoids libfreetype dependency)
  const cmd = [
    "ffmpeg -y",
    `-f lavfi -i "color=c=${color}:s=1280x720:d=4:r=24"`,
    "-c:v libx264 -pix_fmt yuv420p -t 4",
    `"${outputPath}"`,
  ].join(" ");

  console.log(`[pika-mock] Generating mock clip for scene ${index + 1}`);
  await execAsync(cmd);

  // Verify file was created
  await fs.access(outputPath);
  return outputPath;
}

module.exports = { generateVideoClip };
