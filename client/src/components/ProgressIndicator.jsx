const STEPS = [
  { key: "script", label: "Generating Script" },
  { key: "video", label: "Creating Video Clips" },
  { key: "audio", label: "Generating Narration" },
  { key: "merge", label: "Merging Final Video" },
];

export default function ProgressIndicator({ progress }) {
  // progress is a Map-like object: { script: "done", video: "in_progress", ... }
  return (
    <div className="progress-indicator">
      {STEPS.map((step, i) => {
        const status = progress[step.key] || "pending";
        return (
          <div key={step.key} className={`progress-step ${status}`}>
            <div className="step-icon">
              {status === "done" ? (
                <span className="check">✓</span>
              ) : status === "in_progress" ? (
                <span className="spinner" />
              ) : (
                <span className="dot" />
              )}
            </div>
            <span className="step-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
