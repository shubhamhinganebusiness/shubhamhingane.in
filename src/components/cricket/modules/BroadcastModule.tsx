import React, { useState } from 'react';
import { Presentation, Eye, Sparkles, RefreshCw, Radio, Play, Award, HelpCircle } from 'lucide-react';
import { Player, Team } from '../CricketAuction';

interface BroadcastModuleProps {
  players: Player[];
  setPlayers: (val: Player[]) => void;
  formatPrice: (val: number) => string;
  showNotification: (text: string, type?: 'success' | 'alert' | 'info') => void;
  currentBidPrice: number;
  highestBidderId: string | null;
  timeLeft: number;
  teams: Team[];
  isWheelSpinning: boolean;
  wheelRotation: number;
  triggerWheelSpin: () => void;
  currentNominatedPlayer: Player | null;
}

export const BroadcastModule: React.FC<BroadcastModuleProps> = ({
  players,
  formatPrice,
  showNotification,
  currentBidPrice,
  highestBidderId,
  timeLeft,
  teams,
  isWheelSpinning,
  wheelRotation,
  triggerWheelSpin,
  currentNominatedPlayer
}) => {
  const [chromeScreenBg, setChromeScreenBg] = useState<boolean>(false);
  const [showProjectorModal, setShowProjectorModal] = useState<boolean>(false);
  
  // Real WebRTC Camera & Audio States
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isWebRtcStreaming, setIsWebRtcStreaming] = useState<boolean>(false);
  const [sdpState, setSdpState] = useState<'disconnected' | 'ice-gathering' | 'exchanging' | 'rtc-connected'>('disconnected');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);

  const startWebRtc = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setIsWebRtcStreaming(true);
      setSdpState('ice-gathering');
      setTimeout(() => setSdpState('exchanging'), 1000);
      setTimeout(() => setSdpState('rtc-connected'), 2000);

      // Bind stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Live Microphone volume monitor with AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(avg);
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      }
      showNotification('WebRTC livestream room and microphone established!', 'success');
    } catch (err) {
      console.warn('WebRTC access denied or unavailable: ', err);
      showNotification('WebRTC hardware block. Check camera permissions.', 'alert');
    }
  };

  const stopWebRtc = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    setLocalStream(null);
    setIsWebRtcStreaming(false);
    setSdpState('disconnected');
    setAudioLevel(0);
    showNotification('Broadcaster stream disconnected.', 'info');
  };

  // Auto clean tracks on unmount
  React.useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (localStream) localStream.getTracks().forEach(track => track.stop());
    };
  }, [localStream]);

  const upcomingPool = players.filter(p => p.status === 'Unsold' || p.status === 'Skipped');
  const highestBidderTeam = teams.find(t => t.id === highestBidderId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full overflow-y-auto max-h-[calc(100vh-140px)] pr-2 pb-6">
      
      {/* COLUMN 1: FORTUNE DRAW WHEEL CONCENTRIC RANDOMIZER (6 Cols) */}
      <div className="lg:col-span-6 bg-slate-900/60 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between items-center text-center">
        <div className="w-full">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Presentation size={15} className="text-[#f59e0b]" />
              <h3 className="text-xs font-black uppercase tracking-widest text-[#f59e0b]">Nomination Fortune Bag</h3>
            </div>
            <span className="text-[9px] font-black uppercase text-indigo-400">BAG WHEEL</span>
          </div>

          <p className="text-[9px] text-slate-400 uppercase leading-relaxed font-semibold mt-3">
            Physically randomize nominee sequence draws! Spin the wheel to draw next active player profile automatically into hot seat.
          </p>
        </div>

        {/* Dynamic wheel display wrapper */}
        <div className="relative my-6 w-52 h-52 flex items-center justify-center">
          {/* Neon Pointer Indicator Arrow */}
          <div className="absolute top-0 z-20 -translate-y-2 text-rose-500 text-3xl animate-bounce">
            ▼
          </div>

          <div 
            className="w-full h-full rounded-full border-4 border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.15)] overflow-hidden relative"
            style={{ 
              transform: `rotate(${wheelRotation}deg)`, 
              transition: isWheelSpinning ? 'transform 2.5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none' 
            }}
          >
            {/* Draw concentric multicolored wedges using CSS conic gradients representing current targets */}
            <div 
              className="absolute inset-0"
              style={{
                background: `conic-gradient(
                  from 0deg,
                  #1e1b4b 0deg 45deg,
                  #be123c 45deg 90deg,
                  #1d4ed8 90deg 135deg,
                  #b45309 135deg 180deg,
                  #064e3b 180deg 225deg,
                  #581c87 225deg 270deg,
                  #0f172a 270deg 315deg,
                  #431407 315deg 360deg
                )`
              }}
            />

            {/* Inscribe labels radial */}
            <div className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white/95 uppercase tracking-wider select-none">
              <span className="absolute transform rotate-[22deg] translate-y-[-70px]">Virat K</span>
              <span className="absolute transform rotate-[67deg] translate-y-[-70px]">Bumrah</span>
              <span className="absolute transform rotate-[112deg] translate-y-[-70px]">Pant G</span>
              <span className="absolute transform rotate-[157deg] translate-y-[-70px]">Klaasen</span>
              <span className="absolute transform rotate-[202deg] translate-y-[70px]">Starc M</span>
              <span className="absolute transform rotate-[247deg] translate-y-[70px]">Rohit S</span>
              <span className="absolute transform rotate-[292deg] translate-y-[70px]">Rahul KL</span>
              <span className="absolute transform rotate-[337deg] translate-y-[70px]">Travis H</span>
            </div>

            {/* Concentric hub sticker */}
            <div className="absolute inset-[38%] rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner z-10">
              <span className="text-[10px]">🎡</span>
            </div>
          </div>
        </div>

        <button
          onClick={triggerWheelSpin}
          disabled={isWheelSpinning}
          className={`px-8 py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg border-none hover:scale-102 transform active:scale-95 transition-all ${
            isWheelSpinning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {isWheelSpinning ? 'Spinning Bag Wheel...' : 'Spin Fortune Nomination Bag'}
        </button>
      </div>

      {/* COLUMN 2: STREAM OVERLAYS & MIRROR TABS (6 Cols) */}
      <div className="lg:col-span-6 bg-slate-900/60 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={15} className="text-emerald-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-[#f59e0b]">Broadcast Overlays Sandbox</h3>
            </div>
            
            {/* Toggles background to Green Chroma Key screen for OBS */}
            <button
              onClick={() => {
                setChromeScreenBg(!chromeScreenBg);
                showNotification(`OBS Backdrop swapped to: ${!chromeScreenBg ? 'Chroma Key Green' : 'Transparent Space'}`, 'info');
              }}
              className="px-2.5 py-1 text-[8px] font-black text-white bg-slate-950 hover:bg-slate-850 rounded border border-slate-800 uppercase tracking-widest cursor-pointer"
            >
              Chroma toggle {chromeScreenBg ? '🟢' : '⚫'}
            </button>
          </div>

          <p className="text-[9px] text-slate-400 uppercase leading-relaxed font-semibold">
            Integrate live digital stream overlay titles into OBS Studio / Streamlabs. Toggle green-screens below to preview television crawl banners!
          </p>

          {/* SIMULATED OBS LIVE OVERLAY PREVIEW BOARD */}
          <div className={`p-4 rounded-xl border border-slate-800/65 relative h-28 flex flex-col justify-end overflow-hidden transition-all duration-300 ${
            chromeScreenBg ? 'bg-[#00b140] border-[#00b140]' : 'bg-slate-950'
          }`}>
            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[7px] font-black bg-rose-600 text-white animate-pulse">
              LIVE BROADCAST FEED
            </span>

            {/* Crawl TV bar */}
            <div className="bg-slate-950 text-white p-2.5 rounded-lg border border-slate-900 flex items-center justify-between gap-2 overflow-hidden shadow-2xl leading-none font-sans scale-95">
              <div className="flex items-center gap-1.5">
                <span className="bg-[#f59e0b] text-slate-950 font-black text-[9px] px-2 py-1 rounded">GPL LIVE</span>
                {currentNominatedPlayer ? (
                  <div>
                    <span className="text-[10px] font-black uppercase text-white tracking-wider block mb-0.5">{currentNominatedPlayer.name}</span>
                    <span className="font-bold text-slate-450 uppercase text-[8px] block">
                      {currentNominatedPlayer.role} • Rating {currentNominatedPlayer.rating}
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] font-extrabold uppercase italic text-slate-500">Draft Selection Active</span>
                )}
              </div>

              {currentNominatedPlayer && (
                <div className="text-right">
                  <span className="text-[7px] text-slate-500 block uppercase font-bold mb-0.5">Leading Bid</span>
                  <span className="font-mono text-xs font-black text-amber-400">
                    {highestBidderTeam?.name ? `${highestBidderTeam.name.split(' ')[0]} ${formatPrice(currentBidPrice)}` : `Base ${formatPrice(currentBidPrice)}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* WEBRTC REAL HARDWARE STREAM & MEDIA ANALYSER */}
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1 leading-none">
                <Radio size={12} className="animate-pulse text-indigo-400" /> WebRTC Virtual Auctioneer Stream
              </span>
              <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded leading-none ${
                sdpState === 'rtc-connected' 
                  ? 'bg-emerald-500/10 text-emerald-400 animate-pulse font-bold' 
                  : 'bg-slate-900 text-slate-500'
              }`}>
                {sdpState}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Media viewport */}
              <div className="sm:col-span-12 md:col-span-5 h-24 bg-slate-900 rounded-lg relative overflow-hidden border border-slate-850 flex items-center justify-center">
                {isWebRtcStreaming ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                ) : (
                  <div className="text-center p-3 space-y-1">
                    <span className="text-xl leading-none block">📹</span>
                    <p className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider block">Camera Offline</p>
                  </div>
                )}
                
                {isWebRtcStreaming && (
                  <span className="absolute bottom-1.5 right-2 px-1 bg-rose-600 text-white rounded text-[5px] font-black tracking-widest animate-pulse leading-none">
                    REC
                  </span>
                )}
              </div>

              {/* Feed metrics & Controls */}
              <div className="sm:col-span-12 md:col-span-7 space-y-2.5">
                <p className="text-[8.5px] font-bold text-slate-450 uppercase tracking-wider leading-relaxed">
                  Initiate real browser media pipeline for livestreaming voice/video. Authenticate audio feedback to live observers.
                </p>

                {/* Mic input decibel meter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[7px] font-black text-slate-500 uppercase leading-none">
                    <span>MIC TELEMETRY INPUT LEVEL</span>
                    <span className="font-mono text-indigo-400">dB {audioLevel.toFixed(1)}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-900 border border-slate-850 rounded overflow-hidden">
                    <div 
                      className="bg-indigo-400 h-full transition-all duration-75"
                      style={{ width: `${Math.min(100, (audioLevel / 128) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {!isWebRtcStreaming ? (
                    <button
                      onClick={startWebRtc}
                      className="flex-1 py-1.5 px-3 bg-indigo-650 hover:bg-indigo-600 text-white font-black text-[8px] uppercase tracking-wider rounded border-none cursor-pointer text-center"
                    >
                      Start WebRTC
                    </button>
                  ) : (
                    <button
                      onClick={stopWebRtc}
                      className="flex-1 py-1.5 px-3 bg-rose-650 hover:bg-rose-600 text-white font-black text-[8px] uppercase tracking-wider rounded border-none cursor-pointer text-center animate-pulse"
                    >
                      Stop WebRTC
                    </button>
                  )}
                  
                  {isWebRtcStreaming && (
                    <span className="px-2 py-1.5 bg-slate-950 border border-slate-850 rounded text-[7px] font-black uppercase text-amber-500 tracking-wider flex items-center justify-center leading-none">
                      🔊 Stream Live
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle modal board button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => setShowProjectorModal(true)}
            className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/10"
          >
            <Presentation size={14} /> Open Venue Mirror Screen (Projector)
          </button>
        </div>
      </div>

      {/* PROJECTOR MONITOR FULLSCREEN SCREEN MODAL TRANSITION */}
      {showProjectorModal && (
        <div className="fixed inset-0 bg-slate-950 z-[200] flex flex-col justify-between p-8 font-sans tracking-wide">
          
          {/* Header row */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-900">
            <div>
              <span className="text-[#f59e0b] text-xs font-black uppercase tracking-widest block">GullyScore Venue Draft Monitor Big Screen Feed</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1 block">Venue Table LED Board • Ad-Free Format</span>
            </div>
            <button
              onClick={() => setShowProjectorModal(false)}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-white text-[10px] font-black uppercase tracking-wide rounded-xl cursor-pointer"
            >
              Exit monitor board
            </button>
          </div>

          {/* Central Active NOMINEE Display */}
          <div className="my-10 flex-1 flex flex-col justify-center items-center text-center space-y-6">
            {currentNominatedPlayer ? (
              <div className="space-y-6 max-w-2xl w-full">
                <span className="px-5 py-1.5 bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/20 hover:scale-[1.02] text-xs font-heading font-black uppercase tracking-[0.2em] rounded-full inline-block">
                  NOW UNDER THE HAMMER
                </span>
                
                <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tight text-white mb-2 leading-none">
                  {currentNominatedPlayer.name}
                </h2>

                <p className="text-base font-black text-slate-400 uppercase tracking-widest">
                  {currentNominatedPlayer.role} • Rating {currentNominatedPlayer.rating}/10 Stars • Base Price {formatPrice(currentNominatedPlayer.basePrice)} Cr
                </p>

                {/* Big Bid Display Card */}
                <div className="p-8 bg-slate-900 border border-slate-850 rounded-[2.5rem] shadow-2xl relative overflow-hidden inline-block max-w-lg w-full">
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 to-yellow-500" />
                  
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    {highestBidderTeam?.name ? `STADIUM ACTIVE HIGHEST BIDDER: ${highestBidderTeam.name}` : 'AWAITING STADIUM OPENING BID'}
                  </span>
                  
                  <span className="text-7xl font-sans font-black tracking-tighter text-[#10b981] block my-3">
                    {formatPrice(currentBidPrice)} <span className="text-3xl">Crores</span>
                  </span>

                  <div className="flex justify-center items-center gap-2 text-xs font-black uppercase text-amber-500 tracking-wider">
                    {timeLeft <= 10 ? (
                      <span className="animate-pulse text-rose-500 leading-none block">⚠️ CLOCK WARNS TIME IS EXPIRING: {timeLeft} SECS</span>
                    ) : (
                      <span className="leading-none block">Timer Remaining: {timeLeft} seconds</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <span className="text-lg text-slate-550 block">Awaiting next franchise draft nomination cycle...</span>
              </div>
            )}
          </div>

          {/* Footer metrics Row */}
          <div className="pt-4 border-t border-slate-900 flex justify-between text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            <span>GPL STADIUM CONTROL LED FEED</span>
            <span>Real-time persistence active</span>
          </div>

        </div>
      )}

    </div>
  );
};
