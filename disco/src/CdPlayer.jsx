import { useRef, useEffect, useState, useCallback } from 'react';
import Lenis from 'lenis';
import albums from './albums';
import useAudio from './useAudio';
import './CdPlayer.css';

const N = albums.length;
const ACTIVE_ANGLE = Math.PI / 2;
const SNAP_THRESHOLD = 0.38;
const SCROLL_PER_CD = 800;
const MAX_SCROLL = SCROLL_PER_CD * (N - 1);

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function normAngle(a) { return ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); }
function angleDist(a, b) { const d = normAngle(a - b); return d > Math.PI ? Math.PI * 2 - d : d; }
function smoothstep(e0, e1, x) { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }

function cdSize() { return clamp(window.innerWidth * 0.13, 120, 220); }
function orbitRX() { return window.innerWidth * 0.6; }
function orbitRY() { return clamp(window.innerWidth * 0.22, 120, 340); }

export default function CdPlayer() {
  const discWellRef = useRef(null);
  const cdRefs = useRef([]);
  const activeRef = useRef(0);
  const hasScrolledRef = useRef(false);
  const lenisRef = useRef(null);

  const [activeAlbum, setActiveAlbum] = useState(albums[0]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);

  const { init, setSnapVolumes, playCdInsertSound, togglePause, isPaused, cleanup } = useAudio();
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const onFirstScroll = useCallback(() => {
    if (hasScrolledRef.current) return;
    hasScrolledRef.current = true;
    setHasScrolled(true);
    init();
  }, [init]);

  useEffect(() => {
    let rafId;

    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', () => {
      onFirstScroll();
    });

    function frame(time) {
      lenis.raf(time);

      const scrollVal = clamp(lenis.scroll, 0, MAX_SCROLL);
      const frac = MAX_SCROLL > 0 ? scrollVal / MAX_SCROLL : 0;
      const base = frac * ((N - 1) / N) * Math.PI * 2;

      const rx = orbitRX();
      const ry = orbitRY();

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;

      const well = discWellRef.current;
      let discCX = cx, discCY = cy;
      if (well) {
        const r = well.getBoundingClientRect();
        discCX = r.left + r.width / 2;
        discCY = r.top + r.height / 2;
      }

      let bestIdx = 0, bestDist = Infinity;
      const angles = [];

      for (let i = 0; i < N; i++) {
        const angle = normAngle(ACTIVE_ANGLE - (i / N) * Math.PI * 2 + base);
        const dist = angleDist(angle, ACTIVE_ANGLE);
        angles.push({ angle, dist });
        if (dist < bestDist) { bestDist = dist; bestIdx = i; }
      }

      if (bestIdx !== activeRef.current) {
        activeRef.current = bestIdx;
        setActiveAlbum(albums[bestIdx]);
        setActiveIndex(bestIdx);
        if (hasScrolledRef.current) playCdInsertSound();
      }

      const snapValues = [];
      const size = cdSize();
      const fadeMargin = size * 0.6;

      for (let i = 0; i < N; i++) {
        const { angle, dist } = angles[i];
        const sinA = Math.sin(angle);
        const cosA = Math.cos(angle);

        const orbX = rx * cosA;
        const orbY = ry * sinA - ry * 0.55;

        const snap = smoothstep(SNAP_THRESHOLD, 0, dist);
        snapValues.push(snap);

        const inFrontHalf = sinA > -0.15;

        const targetX = discCX - cx;
        const targetY = discCY - cy;
        const finalX = lerp(orbX, targetX, snap);
        const finalY = lerp(orbY, targetY, snap);

        const screenX = cx + finalX;
        const distFromEdge = Math.min(screenX + size / 2, window.innerWidth - screenX + size / 2);
        const edgeFade = clamp(distFromEdge / fadeMargin, 0, 1);
        const visibility = inFrontHalf ? edgeFade : 0;

        const el = cdRefs.current[i];
        if (!el) continue;

        const px = cx + finalX - size / 2;
        const py = cy + finalY - size / 2;
        el.style.transform = `translate(${px}px,${py}px)`;
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.zIndex = snap > 0.5 ? 55 : Math.floor((1 - Math.abs(cosA)) * 40);
        el.style.opacity = visibility.toFixed(3);

        if (i === bestIdx && bestDist < 0.12 && !pausedRef.current) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }

      setSnapVolumes(snapValues);
      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      cleanup();
    };
  }, [onFirstScroll, setSnapVolumes, playCdInsertSound, cleanup]);

  const goTo = useCallback((idx) => {
    onFirstScroll();
    const target = clamp(idx, 0, N - 1) * SCROLL_PER_CD;
    lenisRef.current?.scrollTo(target, { duration: 1.4 });
  }, [onFirstScroll]);

  const prev = useCallback(() => goTo(activeRef.current - 1), [goTo]);
  const next = useCallback(() => goTo(activeRef.current + 1), [goTo]);

  const handlePlayPause = useCallback(() => {
    onFirstScroll();
    togglePause();
    const nowPaused = isPaused();
    setPaused(nowPaused);
    pausedRef.current = nowPaused;
  }, [onFirstScroll, togglePause, isPaused]);

  return (
    <>
    <div className="scene">
      <div className="sceneVignette" />

      {/* Centered column: info + player */}
      <div className="playerColumn">
        {/* EQ bars */}
        <div className={`eq${hasScrolled ? ' visible' : ''}`}>
          <div className="eqBar" />
          <div className="eqBar" />
          <div className="eqBar" />
          <div className="eqBar" />
          <div className="eqBar" />
        </div>

        {/* Song info */}
        <div className="songInfo visible">
          <div className="songTitle">{activeAlbum.title}</div>
          <div className="songArtist">{activeAlbum.artist}</div>
        </div>

        {/* CD Player — MUJI CPD-4 */}
        <div className="player">
          <div className="playerBody">
            <div className="topControls">
              <div className="topBtn" onClick={prev}><span className="topBtnIcon">⏮</span></div>
              <div className="topBtn playBtn" onClick={handlePlayPause}><span className="topBtnIcon">{paused ? '▶' : '⏸'}</span></div>
              <div className="topBtn" onClick={next}><span className="topBtnIcon">⏭</span></div>
            </div>
            <div className="discWellArea">
              <div className="discWellOuter">
                <div className="discWell" ref={discWellRef}>
                  <div className="discWellRing ring1" />
                  <div className="discWellRing ring2" />
                  <div className="discWellSpindle">
                    <div className="spindleTop" />
                  </div>
                </div>
              </div>
            </div>
            <div className="speakerArea">
              <div className="cornerSpeaker left">
                <div className="speakerHoles" />
              </div>
              <div className="cornerSpeaker right">
                <div className="speakerHoles" />
              </div>
            </div>
          </div>
          <div className="pullCord">
            <div className="cordLine" />
            <div className="cordEnd" />
          </div>
        </div>

        <div className="trackPosition visible">
          {activeIndex + 1} / {N}
        </div>
      </div>

      {/* CDs */}
      <div className="cdContainer">
        {albums.map((album, i) => (
          <div
            key={album.title}
            className="cd"
            ref={(el) => { cdRefs.current[i] = el; }}
          >
            <div className="cdDisc">
              <div
                className="cdArt"
                style={{
                  background: `url(${album.cover}) center/cover, ${album.gradient}`,
                }}
              />
              <div className="cdTracks" />
              <div className="cdSheen" />
              <div className="cdRim" />
              <div className="cdHole" />
            </div>
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      <div className="scrollHint" style={{ opacity: hasScrolled ? 0 : 1 }}>
        <span className="scrollHintArrow">↓</span>
        scroll to play
      </div>
    </div>
    <div style={{ height: `calc(${MAX_SCROLL}px + 100vh)` }} />
    </>
  );
}
