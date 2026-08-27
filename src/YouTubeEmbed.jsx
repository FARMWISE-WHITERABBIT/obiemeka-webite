import React, { useState } from 'react'

// Reusable YouTube embed (Component 2). A click-to-load facade — a
// lightweight thumbnail that swaps for the real iframe on click — so a page
// with several videos doesn't pay for every player up front.
export function YouTubeEmbed({ videoId, title = 'YouTube video' }) {
  const [loaded, setLoaded] = useState(false)
  if (!videoId) return null

  return (
    <div className="yt-embed">
      {loaded ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className="yt-embed-facade"
          onClick={() => setLoaded(true)}
          aria-label={`Play: ${title}`}
          style={{ backgroundImage: `url(https://i.ytimg.com/vi/${videoId}/hqdefault.jpg)` }}
        >
          <span className="yt-play" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </button>
      )}
    </div>
  )
}
