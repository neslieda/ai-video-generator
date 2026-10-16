const path = require("path");
const fs = require("fs/promises");
const { v4: uuidv4 } = require("uuid");

const TMP_DIR = path.join(__dirname, "..", "tmp");

// Auto-cleanup timeout (30 minutes)
const CLEANUP_DELAY_MS = 30 * 60 * 1000;

/**
 * Create a unique temporary directory for a single generation job.
 * Returns the absolute path to the new directory.
 */
async function createJobDir() {
  const jobId = uuidv4();
  const jobDir = path.join(TMP_DIR, jobId);
  await fs.mkdir(jobDir, { recursive: true });
  return { jobId, jobDir };
}

/**
 * Build an absolute path for a temp file inside a job directory.
 */
function getTempFilePath(jobDir, filename) {
  // Prevent path traversal — strip any directory separators from filename
  const safe = path.basename(filename);
  return path.join(jobDir, safe);
}

/**
 * Delete a job directory and all its contents.
 */
async function cleanupJobDir(jobDir) {
  try {
    await fs.rm(jobDir, { recursive: true, force: true });
    console.log(`[cleanup] Removed ${jobDir}`);
  } catch (err) {
    console.error(`[cleanup] Failed to remove ${jobDir}:`, err.message);
  }
}

/**
 * Schedule automatic cleanup of a job directory after CLEANUP_DELAY_MS.
 */
function scheduleCleanup(jobDir) {
  setTimeout(() => cleanupJobDir(jobDir), CLEANUP_DELAY_MS);
}

module.exports = {
  createJobDir,
  getTempFilePath,
  cleanupJobDir,
  scheduleCleanup,
};
