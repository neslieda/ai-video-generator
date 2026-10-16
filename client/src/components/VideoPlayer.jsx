export default function VideoPlayer({ videoUrl }) {
  if (!videoUrl) return null;

  return (
    <div className="video-player">
      <h3>Your Generated Video</h3>
      <video controls autoPlay width="100%">
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support video playback.
      </video>
    </div>
  );
}
