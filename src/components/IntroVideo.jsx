import React, { useEffect, useRef, useState } from "react";

const INTRO_STORAGE_KEY = "escuchaVivaIntroSeen";

function hasSeenIntro() {
  try {
    return globalThis.localStorage?.getItem(INTRO_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function markIntroAsSeen() {
  try {
    globalThis.localStorage?.setItem(INTRO_STORAGE_KEY, "true");
  } catch {
    // If storage is unavailable, never block access to the simulator.
  }
}

export function IntroVideo({ children }) {
  const [introSeen, setIntroSeen] = useState(hasSeenIntro);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) globalThis.clearTimeout(closeTimerRef.current);
    };
  }, []);

  function finishIntro() {
    if (isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = globalThis.setTimeout(() => {
      markIntroAsSeen();
      setIntroSeen(true);
    }, 240);
  }

  if (introSeen) return children;

  return (
    <main className={`intro-video-shell ${isClosing ? "is-closing" : ""}`} aria-label="Intro Escucha Viva">
      <button className="intro-skip-button" type="button" onClick={finishIntro}>
        Saltar intro
      </button>

      <section className="intro-video-card">
        <img className="intro-video-logo" src="/logo-escucha-viva-horizontal.png" alt="Escucha Viva" />
        <div className="intro-video-frame">
          <video
            controls
            playsInline
            preload="metadata"
            src="/videos/escucha-viva-intro.mp4"
            onEnded={finishIntro}
            onError={finishIntro}
          />
        </div>
      </section>
    </main>
  );
}
