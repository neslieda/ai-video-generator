import { useState } from "react";

export default function PromptInput({ onGenerate, disabled }) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() && !disabled) {
      onGenerate(prompt.trim());
    }
  };

  return (
    <form className="prompt-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="prompt-input"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder='Enter a concept, e.g. "fear of heights"'
        maxLength={500}
        disabled={disabled}
      />
      <button
        type="submit"
        className="generate-btn"
        disabled={disabled || !prompt.trim()}
      >
        {disabled ? "Generating…" : "Generate Video"}
      </button>
    </form>
  );
}
