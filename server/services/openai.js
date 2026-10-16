const OpenAI = require("openai");

// System prompt: cinematic director producing a visual storyboard
const SYSTEM_PROMPT = `You are a cinematic director and screenwriter specializing in short-form visual storytelling. Given a user's concept, produce 3-5 connected scenes that tell a cohesive visual story.

Rules for each scene:
- 1-2 sentences only.
- Begin with a shot type (e.g., "Wide shot:", "Close-up:", "POV shot:", "Tracking shot:", "Aerial shot:", "Low-angle shot:").
- Include specific visual details: lighting, colors, weather, environment, textures.
- Show emotion through body language, facial expressions, and atmosphere — never state emotions abstractly.
- Maintain character and setting consistency across all scenes.
- Scenes must form a clear narrative arc: setup \u2192 tension/build \u2192 peak moment.

Also write a short narration script (2-4 sentences) that could accompany the video as voiceover. The narration should be poetic and reflective, complementing the visuals — not a literal description of what is on screen.

Respond ONLY with valid JSON in this exact format:
{
  "scenes": [
    "Scene 1: ...",
    "Scene 2: ...",
    "Scene 3: ..."
  ],
  "narrationScript": "..."
}

Example — input: "fear of heights"
Output:
{
  "scenes": [
    "Scene 1: Wide shot of a young person standing at the edge of a skyscraper rooftop at dusk, city lights flickering below, wind tugging at their jacket as they peer over the railing.",
    "Scene 2: Close-up of their face — eyes wide, beads of sweat catching the fading light, shallow depth of field blurring the distant skyline behind them.",
    "Scene 3: POV shot looking straight down from the ledge, the ground impossibly far below, a slow vertigo spin distorting the frame."
  ],
  "narrationScript": "Some fears live not in the mind, but in the body — in the trembling hands, the racing pulse, the ground that seems to pull you closer even as you pull away."
}`;

/**
 * Call OpenAI to convert a user prompt into cinematic scene descriptions
 * and a narration script.
 *
 * Returns: { scenes: string[], narrationScript: string }
 */
async function generateSceneDescriptions(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;

  // If no API key, return mock scenes for development
  if (!apiKey || apiKey === "your_openai_api_key_here") {
    console.log("[openai] No API key — returning mock scene descriptions");
    return getMockScenes(prompt);
  }

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.8,
    max_tokens: 600,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  const parsed = JSON.parse(content);

  // Validate structure
  if (
    !Array.isArray(parsed.scenes) ||
    parsed.scenes.length < 3 ||
    parsed.scenes.length > 5 ||
    typeof parsed.narrationScript !== "string" ||
    !parsed.narrationScript.trim()
  ) {
    throw new Error(
      "OpenAI response did not match expected format (3-5 scenes + narrationScript)"
    );
  }

  return {
    scenes: parsed.scenes,
    narrationScript: parsed.narrationScript,
  };
}

/**
 * Mock scene descriptions for when OpenAI API key is not available.
 */
function getMockScenes(prompt) {
  return {
    scenes: [
      `Scene 1: Wide establishing shot — a lone figure stands in a vast, misty landscape that embodies "${prompt}", golden hour light casting long shadows across the terrain.`,
      `Scene 2: Tracking shot moving closer to the figure, revealing tension in their posture, hands clenched, the environment around them shifting subtly with an air of unease.`,
      `Scene 3: Close-up of the figure's face — eyes reflecting the scene before them, a single breath visible in the cold air, the weight of "${prompt}" etched in every detail.`,
      `Scene 4: Wide pull-back shot as the figure takes a single step forward, the landscape transforming with the motion, light breaking through the clouds in a moment of quiet resolve.`,
    ],
    narrationScript: `There are moments that define us — not by their grandeur, but by the stillness they demand. In the space between fear and courage, we find what it means to move forward.`,
  };
}

module.exports = { generateSceneDescriptions };
