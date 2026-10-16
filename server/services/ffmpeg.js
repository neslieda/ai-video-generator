const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs/promises");
const path = require("path");
const { getTempFilePath } = require("../utils/fileManager");

/**
 * Merge multiple video clips into one video and overlay narration audio.
 *
 * Steps:
 *  1. Write a concat demuxer file listing all clips.
 *  2. Concatenate clips into a single video.
 *  3. Mix in the narration audio (shortest stream wins to avoid hanging).
 *
 * Returns the absolute path to the final output MP4.
 */
async function mergeVideoAndAudio(clipPaths, audioPath, jobDir) {
  const concatListPath = getTempFilePath(jobDir, "concat.txt");
  const concatenatedPath = getTempFilePath(jobDir, "concatenated.mp4");
  const outputPath = getTempFilePath(jobDir, "final.mp4");

  // Step 1: Write concat demuxer list
  const concatContent = clipPaths
    .map((p) => `file '${p}'`)
    .join("\n");
  await fs.writeFile(concatListPath, concatContent);

  // Step 2: Concatenate video clips
  await runFfmpeg((cmd) =>
    cmd
      .input(concatListPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-c", "copy"])
      .output(concatenatedPath)
  );
  console.log("[ffmpeg] Clips concatenated");

  // Step 3: Overlay audio onto concatenated video
  await runFfmpeg((cmd) =>
    cmd
      .input(concatenatedPath)
      .input(audioPath)
      .outputOptions([
        "-c:v", "libx264",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",       // end when the shortest stream ends
        "-pix_fmt", "yuv420p",
      ])
      .output(outputPath)
  );
  console.log("[ffmpeg] Audio merged — final video ready");

  return outputPath;
}

/**
 * Wrapper to run a fluent-ffmpeg command as a promise.
 * The `configure` callback receives the ffmpeg command instance.
 */
function runFfmpeg(configure) {
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg();
    configure(cmd);
    cmd
      .on("end", resolve)
      .on("error", (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .run();
  });
}

module.exports = { mergeVideoAndAudio };
