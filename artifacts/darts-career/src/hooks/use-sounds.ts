import { useRef, useCallback } from "react";

export function useDartsSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  function getCtx(): AudioContext {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }

  const playCrowdCheer = useCallback((duration = 3.5, volume = 0.35) => {
    try {
      const ctx = getCtx();
      const sampleRate = ctx.sampleRate;
      const bufSize = Math.floor(sampleRate * duration);
      const buffer = ctx.createBuffer(2, bufSize, sampleRate);

      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
        for (let i = 0; i < bufSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + white * 0.5362) * 0.11;
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = false;

      const bpf = ctx.createBiquadFilter();
      bpf.type = "bandpass";
      bpf.frequency.value = 1200;
      bpf.Q.value = 0.4;

      const gainNode = ctx.createGain();
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.4);
      gainNode.gain.setValueAtTime(volume, now + duration * 0.6);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);

      source.connect(bpf);
      bpf.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(now);
      source.stop(now + duration);
    } catch {}
  }, []);

  const playFanfare = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      const notes = [
        { freq: 392, t: 0,    dur: 0.12 },
        { freq: 523, t: 0.14, dur: 0.12 },
        { freq: 659, t: 0.28, dur: 0.12 },
        { freq: 784, t: 0.42, dur: 0.20 },
        { freq: 880, t: 0.65, dur: 0.35 },
      ];

      notes.forEach(({ freq, t, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + t);
        gain.gain.linearRampToValueAtTime(0.22, now + t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + dur + 0.05);
      });
    } catch {}
  }, []);

  const playDrumRoll = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const rollDur = 1.2;
      const bufSize = Math.floor(ctx.sampleRate * rollDur);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let phase = 0;
      for (let i = 0; i < bufSize; i++) {
        const t = i / ctx.sampleRate;
        const freq = 8 + t * 20;
        phase += (2 * Math.PI * freq) / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.abs(Math.sin(phase));
      }

      const src = ctx.createBufferSource();
      src.buffer = buf;

      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 200;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.3);
      gain.gain.linearRampToValueAtTime(0.7, now + rollDur - 0.1);
      gain.gain.linearRampToValueAtTime(0, now + rollDur);

      src.connect(hp);
      hp.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
      src.stop(now + rollDur);
    } catch {}
  }, []);

  const playMatchStart = useCallback(() => {
    playDrumRoll();
    setTimeout(() => {
      playFanfare();
      playCrowdCheer(4.0, 0.3);
    }, 900);
  }, [playDrumRoll, playFanfare, playCrowdCheer]);

  const playDrawAnimation = useCallback(() => {
    playCrowdCheer(2.5, 0.2);
  }, [playCrowdCheer]);

  const playWin = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const winNotes = [
        { freq: 523, t: 0,    dur: 0.15 },
        { freq: 659, t: 0.18, dur: 0.15 },
        { freq: 784, t: 0.36, dur: 0.15 },
        { freq: 1047, t: 0.54, dur: 0.5 },
      ];
      winNotes.forEach(({ freq, t, dur }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, now + t);
        g.gain.linearRampToValueAtTime(0.28, now + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + dur);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + dur + 0.1);
      });
      playCrowdCheer(3.0, 0.45);
    } catch {}
  }, [playCrowdCheer]);

  return { playMatchStart, playDrawAnimation, playCrowdCheer, playWin };
}
