import { useState, useCallback } from "react";
import PromptInput from "./components/PromptInput";
import ProgressIndicator from "./components/ProgressIndicator";
import VideoPlayer from "./components/VideoPlayer";
import "./App.css";

function App() {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [progress, setProgress] = useState({});
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = useCallback(async (prompt) => {
    // Reset state
    setStatus("loading");
    setProgress({});
    setVideoUrl(null);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || "Server error (" + response.status + ")");
      }

      // Read SSE stream from response body
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse complete SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (data.step === "error") {
              throw new Error(data.error);
            }

            if (data.step === "complete") {
              setVideoUrl(data.videoUrl);
              setStatus("done");
            } else if (data.status) {
              setProgress((prev) => ({
                ...prev,
                [data.step]: data.status,
              }));
            }
          }
        }
      }

      // If status wasn't set to "done" by SSE, mark as error
      setStatus((prev) => (prev === "loading" ? "error" : prev));
    } catch (err) {
      console.error("Generation failed:", err);
      setError(err.message || "Something went wrong.");
      setStatus("error");
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Video Generator</h1>
        <p className="subtitle">
          Enter a concept and watch it come to life as a short cinematic video.
        </p>
      </header>

      <main className="app-main">
        <PromptInput
          onGenerate={handleGenerate}
          disabled={status === "loading"}
        />

        {status === "loading" && <ProgressIndicator progress={progress} />}

        {status === "error" && (
          <div className="error-message">
            <p>{"⚠ " + (error || "An error occurred. Please try again.")}</p>
          </div>
        )}

        {status === "done" && <VideoPlayer videoUrl={videoUrl} />}
      </main>
    </div>
  );
}

export default App;
