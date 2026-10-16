const axios = require("axios");
const fs = require("fs/promises");
const { exec } = require("child_process");
const { promisify } = require("util");
const { getTempFilePath } = require("../utils/fileManager");

const execAsync = promisify(exec);

/**
 * Generate narration audio from a script using the ElevenLabs TTS API.
 *
 * Falls back to generating a silent audio track if the API key is missing
 * or the call fails.
 *
 * Returns the absolute path to the generated audio file (MP3).
 */
async function generateNarration(script, jobDir) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId =
    process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel

  if (apiKey && apiKey !== "your_elevenlabs_api_key_here") {
    try {
      return await generateWithElevenLabs(script, jobDir, apiKey, voiceId);
    } catch (err) {
      console.error(
        "[elevenlabs] API call failed, falling back to silence:",
        err.message
      );
    }
  } else {
    console.log("[elevenlabs] No API key — generating silent audio track");
  }

  return await generateSilentAudio(jobDir);
}

/**
 * Call the ElevenLabs text-to-speech API.
 */
async function generateWithElevenLabs(script, jobDir, apiKey, voiceId) {
  const outputPath = getTempFilePath(jobDir, "narration.mp3");

  const response = await axios({
    method: "POST",
    url: `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    data: {
      text: script,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    },
    responseType: "arraybuffer",
  });

  await fs.writeFile(outputPath, Buffer.from(response.data));
  console.log("[elevenlabs] Narration audio saved");
  return outputPath;
}

/**
 * Generate a silent audio track (duration matches typical video length).
 * Uses FFmpeg to create an empty audio file.
 */
async function generateSilentAudio(jobDir) {
  const outputPath = getTempFilePath(jobDir, "narration.mp3");

  // 20 seconds of silence (enough for 4-5 scenes x 4s each)
  const cmd = `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 20 -q:a 9 "${outputPath}"`;
  await execAsync(cmd);

  console.log("[elevenlabs-mock] Silent audio track generated");
  return outputPath;
}

module.exports = { generateNarration };
