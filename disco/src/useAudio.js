import { useRef, useCallback } from 'react';
import albums from './albums';

const FADE_SPEED = 0.04;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function useAudio() {
  const state = useRef({
    ready: false,
    sfxCtx: null,
    players: [],
    rafId: null,
  });

  const init = useCallback(() => {
    const s = state.current;
    if (s.ready) return;
    s.ready = true;
    s.sfxCtx = new (window.AudioContext || window.webkitAudioContext)();

    albums.forEach((a) => {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.src = a.preview;
      audio.loop = true;
      audio.volume = 0;
      audio.preload = 'auto';
      s.players.push({ audio, target: 0, cur: 0 });
    });

    function tick() {
      s.players.forEach((p) => {
        p.cur = lerp(p.cur, p.target, FADE_SPEED);
        if (p.cur < 0.005) p.cur = 0;
        if (p.cur > 0.995) p.cur = 1;
        p.audio.volume = p.cur;
        if (p.cur > 0.01 && p.audio.paused) {
          p.audio.play().catch(() => {});
        }
        if (p.cur === 0 && !p.audio.paused) {
          p.audio.pause();
        }
      });
      s.rafId = requestAnimationFrame(tick);
    }
    tick();
  }, []);

  const setSnapVolumes = useCallback((snapValues) => {
    const s = state.current;
    if (!s.ready || s.paused) return;
    snapValues.forEach((snap, i) => {
      if (s.players[i]) s.players[i].target = snap;
    });
  }, []);

  const playCdInsertSound = useCallback(() => {
    const ctx = state.current.sfxCtx;
    if (!ctx) return;
    const now = ctx.currentTime;

    // Layer 1: gentle slide
    const slideLen = 0.22;
    const slideBuf = ctx.createBuffer(1, ctx.sampleRate * slideLen, ctx.sampleRate);
    const sd = slideBuf.getChannelData(0);
    for (let i = 0; i < sd.length; i++) {
      const t = i / sd.length;
      sd[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.6;
    }
    const slideSrc = ctx.createBufferSource();
    slideSrc.buffer = slideBuf;
    const slideFilt = ctx.createBiquadFilter();
    slideFilt.type = 'bandpass';
    slideFilt.frequency.value = 2200;
    slideFilt.Q.value = 0.8;
    const slideGain = ctx.createGain();
    slideGain.gain.value = 0.18;
    slideSrc.connect(slideFilt);
    slideFilt.connect(slideGain);
    slideGain.connect(ctx.destination);
    slideSrc.start(now);

    // Layer 2: click
    const clickLen = 0.06;
    const clickBuf = ctx.createBuffer(1, ctx.sampleRate * clickLen, ctx.sampleRate);
    const cd = clickBuf.getChannelData(0);
    for (let j = 0; j < cd.length; j++) {
      cd[j] = (Math.random() * 2 - 1) * Math.exp(-(j / cd.length) * 30);
    }
    const clickSrc = ctx.createBufferSource();
    clickSrc.buffer = clickBuf;
    const clickFilt = ctx.createBiquadFilter();
    clickFilt.type = 'lowpass';
    clickFilt.frequency.value = 3500;
    const clickGain = ctx.createGain();
    clickGain.gain.value = 0.35;
    clickSrc.connect(clickFilt);
    clickFilt.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickSrc.start(now + slideLen * 0.75);

    // Layer 3: low thud
    const thudOsc = ctx.createOscillator();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(120, now + slideLen * 0.7);
    thudOsc.frequency.exponentialRampToValueAtTime(50, now + slideLen * 0.7 + 0.15);
    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.2, now + slideLen * 0.7);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + slideLen * 0.7 + 0.18);
    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudOsc.start(now + slideLen * 0.7);
    thudOsc.stop(now + slideLen * 0.7 + 0.2);

    // Layer 4: tink
    const tinkOsc = ctx.createOscillator();
    tinkOsc.type = 'sine';
    tinkOsc.frequency.value = 4200;
    const tinkGain = ctx.createGain();
    tinkGain.gain.setValueAtTime(0.08, now + slideLen * 0.85);
    tinkGain.gain.exponentialRampToValueAtTime(0.001, now + slideLen * 0.85 + 0.08);
    tinkOsc.connect(tinkGain);
    tinkGain.connect(ctx.destination);
    tinkOsc.start(now + slideLen * 0.85);
    tinkOsc.stop(now + slideLen * 0.85 + 0.1);
  }, []);

  const togglePause = useCallback(() => {
    const s = state.current;
    if (!s.ready) return;
    s.paused = !s.paused;
    if (s.paused) {
      s.players.forEach((p) => {
        p.savedTarget = p.target;
        p.target = 0;
      });
    } else {
      s.players.forEach((p) => {
        if (p.savedTarget !== undefined) {
          p.target = p.savedTarget;
        }
      });
    }
    return s.paused;
  }, []);

  const isPaused = useCallback(() => {
    return !!state.current.paused;
  }, []);

  const cleanup = useCallback(() => {
    const s = state.current;
    if (s.rafId) cancelAnimationFrame(s.rafId);
    s.players.forEach((p) => {
      p.audio.pause();
      p.audio.src = '';
    });
    if (s.sfxCtx) s.sfxCtx.close();
    s.ready = false;
    s.players = [];
  }, []);

  return { init, setSnapVolumes, playCdInsertSound, togglePause, isPaused, cleanup };
}
