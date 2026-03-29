import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoUrl from './assets/opt-logo.png';

const BASE = import.meta.env.BASE_URL ?? '/__mockup/';
const LOGO_URL = logoUrl;

const SCENE_DURATIONS = [
  4000, // 0: Intro
  5000, // 1: Turniere
  5000, // 2: Autodarts
  5000, // 3: OOM
  4000, // 4: Live
  4000, // 5: Outro
];

export default function OptVideo() {
  const [currentScene, setCurrentScene] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScene((prev) => (prev + 1) % SCENE_DURATIONS.length);
    }, SCENE_DURATIONS[currentScene]);
    return () => clearTimeout(timer);
  }, [currentScene]);

  return (
    <div className="w-full h-screen bg-[#0a1517] overflow-hidden relative font-sans text-[#F2EDE8]">
      {/* Persistent Background Layer */}
      <motion.div 
        className="absolute inset-0 z-0 opacity-40"
        animate={{
          scale: currentScene % 2 === 0 ? 1.05 : 1,
          opacity: currentScene === 0 || currentScene === 5 ? 0.3 : 0.6
        }}
        transition={{ duration: 5, ease: "linear" }}
      >
        <video 
          src={`${BASE}videos/neon-arena.mp4`} 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0a1517]/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1517] via-transparent to-[#0a1517]" />
      </motion.div>

      {/* Persistent Accent Elements */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-1 bg-[#C49A2A] z-50 origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: SCENE_DURATIONS[currentScene] / 1000, ease: "linear", key: currentScene }}
      />
      
      <motion.div
        className="absolute bottom-10 left-10 w-32 h-32 rounded-full border border-[#C49A2A]/20 z-0"
        animate={{
          x: currentScene * 50,
          y: currentScene % 2 === 0 ? 20 : -20,
          scale: currentScene === 3 ? 2 : 1,
          rotate: currentScene * 45
        }}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
      />

      <AnimatePresence mode="wait">
        {currentScene === 0 && <Scene1Intro key="scene1" />}
        {currentScene === 1 && <Scene2Turniere key="scene2" />}
        {currentScene === 2 && <Scene3Autodarts key="scene3" />}
        {currentScene === 3 && <Scene4OrderOfMerit key="scene4" />}
        {currentScene === 4 && <Scene5LiveErgebnisse key="scene5" />}
        {currentScene === 5 && <Scene6Outro key="scene6" />}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// SCENE 1: Intro
// ==========================================
function Scene1Intro() {
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="mb-8"
      >
        <div className="w-48 h-48 flex items-center justify-center">
          <img src={LOGO_URL} alt="OPT" className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(196,154,42,0.8)]" />
        </div>
      </motion.div>
      
      <div className="overflow-hidden">
        <motion.h1 
          className="text-7xl font-display tracking-tight text-[#F2EDE8]"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        >
          ONLINE PRO TOUR
        </motion.h1>
      </div>
      
      <div className="overflow-hidden mt-4">
        <motion.p 
          className="text-2xl font-sans text-[#C49A2A] uppercase tracking-widest"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
        >
          Die neue Ära des Dartsports
        </motion.p>
      </div>
    </motion.div>
  );
}

// ==========================================
// SCENE 2: Turniere
// ==========================================
function Scene2Turniere() {
  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 px-20"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-1/2 pr-12">
        <motion.h2 
          className="text-6xl font-display mb-6 leading-none"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <span className="text-stroke-white text-transparent">PROFESSIONELLE</span><br />
          TURNIER<br/>VERWALTUNG
        </motion.h2>
        
        <motion.div
          className="w-12 h-1 bg-[#C49A2A] mb-6"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        />
        
        <motion.p 
          className="text-xl text-[#F2EDE8]/70 leading-relaxed font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          Erstelle Turniere in Sekunden. Spieler melden sich mit einem Klick an. 
          Der Spielplan wird automatisch generiert und live aktualisiert.
        </motion.p>
      </div>
      
      <div className="w-1/2 relative h-[60vh]">
        <motion.div 
          className="absolute inset-0 rounded-2xl overflow-hidden border border-[#C49A2A]/20 shadow-2xl"
          initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ delay: 0.5, duration: 1, type: "spring" }}
          style={{ perspective: 1000 }}
        >
          <div className="w-full h-full bg-[#0d1c1f] p-6 flex flex-col gap-4">
            {/* Mock UI for tournament */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="w-32 h-6 bg-white/10 rounded" />
              <div className="w-16 h-6 bg-[#C49A2A] rounded" />
            </div>
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i}
                className="w-full p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + (i * 0.1) }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#C49A2A]/20" />
                  <div>
                    <div className="w-24 h-4 bg-white/20 rounded mb-2" />
                    <div className="w-16 h-3 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="w-20 h-8 bg-white/10 rounded" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ==========================================
// SCENE 3: Autodarts
// ==========================================
function Scene3Autodarts() {
  return (
    <motion.div 
      className="absolute inset-0 z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0">
        <video 
          src={`${BASE}videos/darts-flying.mp4`} 
          autoPlay 
          loop 
          muted 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1517] via-[#0a1517]/80 to-transparent" />
      </div>

      <div className="absolute inset-0 flex items-center px-20">
        <div className="w-2/3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-16 h-16 rounded-full bg-[#C49A2A] flex items-center justify-center mb-6"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0a1517" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </motion.div>

          <motion.h2 
            className="text-7xl font-display mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            AUTODARTS
            <span className="block text-[#C49A2A]">INTEGRATION</span>
          </motion.h2>

          <motion.p 
            className="text-2xl text-white/80 max-w-xl font-light leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Verknüpfe dein Autodarts-Konto mit einem Klick.
            Lobbys werden automatisch erstellt. Kein manuelles Eintragen mehr nötig.
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// SCENE 4: Order of Merit
// ==========================================
function Scene4OrderOfMerit() {
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ scale: 1.1, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <img src={`${BASE}images/player-silhouette.png`} className="w-full h-full object-cover opacity-20 mix-blend-screen" />
      </motion.div>

      <div className="relative z-10 text-center w-full max-w-4xl">
        <motion.h2 
          className="text-5xl font-display text-[#C49A2A] mb-2 tracking-widest"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          SAISON-RANGLISTE
        </motion.h2>
        <motion.h3 
          className="text-7xl font-display mb-12"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          ORDER OF MERIT
        </motion.h3>

        <div className="bg-[#0d1c1f]/80 backdrop-blur-md rounded-2xl border border-[#C49A2A]/30 p-6 shadow-2xl">
          {[1, 2, 3].map((rank, i) => (
            <motion.div
              key={rank}
              className={`flex items-center justify-between p-4 mb-2 rounded-lg ${rank === 1 ? 'bg-[#C49A2A]/20 border border-[#C49A2A]' : 'bg-white/5'}`}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 + (i * 0.15), type: "spring" }}
            >
              <div className="flex items-center gap-6">
                <span className={`text-3xl font-display ${rank === 1 ? 'text-[#C49A2A]' : 'text-white/50'}`}>#{rank}</span>
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <span className="text-xl font-bold">Pro Player {rank}</span>
              </div>
              <div className="text-right">
                <motion.span 
                  className="text-2xl font-display text-[#C49A2A]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 + (i * 0.1) }}
                >
                  {50000 - (rank * 12500)} Pkt
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// SCENE 5: Live Ergebnisse
// ==========================================
function Scene5LiveErgebnisse() {
  return (
    <motion.div 
      className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 4, ease: "easeOut" }}
      >
        <img src={`${BASE}images/tournament-stage.png`} className="w-full h-full object-cover opacity-20" />
      </motion.div>

      <div className="z-10 text-center">
        <motion.div
          className="inline-block px-4 py-1 bg-red-500/20 border border-red-500 text-red-500 rounded-full font-bold tracking-widest text-sm mb-6"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
        >
          LIVE UPDATES
        </motion.div>

        <motion.h2 
          className="text-8xl font-display mb-12"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          ERGEBNISSE IN<br/><span className="text-[#C49A2A]">ECHTZEIT</span>
        </motion.h2>

        <div className="flex gap-8 justify-center">
          <ScoreCard delay={0.6} player1="P1" player2="P2" score1="5" score2="3" />
          <ScoreCard delay={0.8} player1="P3" player2="P4" score1="2" score2="5" />
          <ScoreCard delay={1.0} player1="P5" player2="P6" score1="4" score2="4" />
        </div>
      </div>
    </motion.div>
  );
}

function ScoreCard({ delay, player1, player2, score1, score2 }: any) {
  return (
    <motion.div 
      className="w-48 bg-[#0d1c1f] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring" }}
    >
      <div className="p-4 flex justify-between items-center border-b border-white/5">
        <span className="font-bold">{player1}</span>
        <span className="text-2xl font-display text-[#C49A2A]">{score1}</span>
      </div>
      <div className="p-4 flex justify-between items-center">
        <span className="font-bold">{player2}</span>
        <span className="text-2xl font-display text-[#C49A2A]">{score2}</span>
      </div>
    </motion.div>
  );
}

// ==========================================
// SCENE 6: Outro
// ==========================================
function Scene6Outro() {
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#0a1517]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", bounce: 0.4 }}
        className="mb-8"
      >
        <div className="w-32 h-32 rounded-full bg-[#0d1c1f] flex items-center justify-center border-2 border-[#C49A2A] shadow-[0_0_80px_rgba(196,154,42,0.4)] overflow-hidden">
          <img src={LOGO_URL} alt="OPT" className="w-full h-full object-contain" />
        </div>
      </motion.div>
      
      <motion.h2 
        className="text-6xl font-display tracking-tight text-white mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        ONLINE PRO TOUR
      </motion.h2>

      <motion.div
        className="px-8 py-4 bg-[#C49A2A] text-[#0a1517] font-bold text-2xl tracking-widest rounded-sm mt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        JETZT MITSPIELEN
      </motion.div>
    </motion.div>
  );
}
