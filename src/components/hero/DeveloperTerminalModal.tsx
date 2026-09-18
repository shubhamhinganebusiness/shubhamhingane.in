import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, X, Copy, Check, Play, Code2, Cpu, 
  Sparkles, ShieldCheck, ArrowRight, CornerDownLeft, RefreshCw, Layers
} from 'lucide-react';

interface DeveloperTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandLog {
  id: string;
  command: string;
  output: React.ReactNode;
  timestamp: string;
}

export const DeveloperTerminalModal: React.FC<DeveloperTerminalModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'cli' | 'code' | 'specs'>('cli');
  const [inputVal, setInputVal] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const initialLogs: CommandLog[] = [
    {
      id: 'init-1',
      command: 'whoami',
      output: (
        <div className="space-y-1 text-slate-300">
          <p className="text-emerald-400 font-bold">Shubham Hingane</p>
          <p className="text-xs text-slate-400">Full-Stack SaaS Architect • Real-Time Systems Engineer • React & Firebase Specialist</p>
          <p className="text-2xs text-slate-500">Location: Pune & Jamkhed, Maharashtra, India • Experience: 5+ Years</p>
        </div>
      ),
      timestamp: '00:01'
    },
    {
      id: 'init-2',
      command: 'shubham --status',
      output: (
        <div className="flex flex-wrap gap-2 text-2xs py-1">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">● Open for Client Projects</span>
          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">● 50+ Deployed Apps</span>
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">● 100k+ Spectator Feeds Served</span>
        </div>
      ),
      timestamp: '00:02'
    }
  ];

  const [logs, setLogs] = useState<CommandLog[]>(initialLogs);

  useEffect(() => {
    if (isOpen && activeTab === 'cli') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    if (!trimmed) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let outputNode: React.ReactNode = null;

    switch (trimmed) {
      case 'help':
        outputNode = (
          <div className="space-y-1 text-xs text-slate-300">
            <p className="text-slate-400 font-semibold mb-1">Available commands:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-2xs">
              <span className="text-emerald-400 font-bold">skills</span> - Core engineering proficiencies
              <span className="text-emerald-400 font-bold">projects</span> - Flagship deployed applications
              <span className="text-emerald-400 font-bold">stack</span> - Tech stack & architecture specs
              <span className="text-emerald-400 font-bold">stats</span> - Production benchmarks & reach
              <span className="text-emerald-400 font-bold">cricket</span> - GullyScore live engine status
              <span className="text-emerald-400 font-bold">contact</span> - Direct phone / WhatsApp link
              <span className="text-emerald-400 font-bold">clear</span> - Reset terminal screen
              <span className="text-emerald-400 font-bold">hire</span> - Launch client project proposal
            </div>
          </div>
        );
        break;

      case 'skills':
        outputNode = (
          <div className="space-y-2 text-xs py-1">
            <div>
              <span className="text-emerald-400 font-bold font-mono">[Frontend & Mobile]:</span>
              <p className="text-slate-300 text-2xs">React 19, TypeScript, Next.js, Vite, Tailwind CSS, Motion Animations, Progressive Web Apps (PWA).</p>
            </div>
            <div>
              <span className="text-sky-400 font-bold font-mono">[Backend & Cloud]:</span>
              <p className="text-slate-300 text-2xs">Node.js, Express, Firebase Firestore & Realtime DB, Cloud Run, Cloud SQL, REST & WebSocket APIs.</p>
            </div>
            <div>
              <span className="text-amber-400 font-bold font-mono">[Broadcast & Special Engines]:</span>
              <p className="text-slate-300 text-2xs">OBS Studio WebSocket Overlay, HTML5 Canvas 300 DPI Rendering, Gemini AI Function Calling, IndexedDB Offline Queuing.</p>
            </div>
          </div>
        );
        break;

      case 'projects':
        outputNode = (
          <div className="space-y-1.5 text-2xs py-1">
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-emerald-400 font-bold">🏏 GullyScore Tournament ERP:</span>
              <span className="text-slate-300 ml-1.5">Live ball-by-ball scoring, Edge Fan-out caching, OBS streaming overlay & ICC NRR points tables.</span>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-sky-400 font-bold">🥛 Dairy & Farmer ERP:</span>
              <span className="text-slate-300 ml-1.5">Morning/Evening milk collection ledger, FAT/SNF rate chart formula, thermal receipt printing.</span>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-amber-400 font-bold">🌾 Agro Mandi Trade Hub:</span>
              <span className="text-slate-300 ml-1.5">Commodity rates ticker, farmer produce listings, wholesale commission book.</span>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-purple-400 font-bold">🪪 Instant ID Card Studio:</span>
              <span className="text-slate-300 ml-1.5">CSV bulk student/employee badge generator with barcodes & 300 DPI print output.</span>
            </div>
          </div>
        );
        break;

      case 'stack':
        outputNode = (
          <div className="text-2xs font-mono space-y-1 py-1 text-slate-300">
            <p className="text-emerald-400">⚡ Client: React 19 + TypeScript + Tailwind CSS (Zero Bloat)</p>
            <p className="text-sky-400">⚡ Real-Time: Firestore onSnapshot + Memory Micro-Cache (1.5s)</p>
            <p className="text-amber-400">⚡ Server: Express + Node.js on Google Cloud Run (asia-southeast1)</p>
            <p className="text-purple-400">⚡ Graphics: HTML5 Canvas 2D + WebGL + Lucide Icons</p>
          </div>
        );
        break;

      case 'stats':
        outputNode = (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1 font-mono text-center">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-base font-black text-emerald-400 block">50+</span>
              <span className="text-3xs uppercase text-slate-400">Deployed Systems</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-base font-black text-sky-400 block">100k+</span>
              <span className="text-3xs uppercase text-slate-400">Spectator Reads</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-base font-black text-purple-400 block">99.9%</span>
              <span className="text-3xs uppercase text-slate-400">Cloud Uptime</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-base font-black text-amber-400 block">&lt; 150ms</span>
              <span className="text-3xs uppercase text-slate-400">Edge Latency</span>
            </div>
          </div>
        );
        break;

      case 'cricket':
        outputNode = (
          <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono text-2xs space-y-1">
            <p className="font-bold text-emerald-400">🏏 GullyScore Engine Status: ONLINE</p>
            <p>• Edge Fan-Out Active: CDN Micro-cached at /api/cricket/live-feed</p>
            <p>• OBS WebSocket Port: 4455 Ready</p>
            <p>• ICC NRR Calculator: Active</p>
          </div>
        );
        break;

      case 'contact':
      case 'hire':
        outputNode = (
          <div className="p-2 rounded bg-primary/20 border border-primary/40 text-xs space-y-1">
            <p className="text-primary font-bold">Let's build something exceptional together!</p>
            <p className="text-slate-300 text-2xs">Phone / WhatsApp: <a href="https://wa.me/7719959593" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-mono">+91 7719959593</a></p>
            <p className="text-slate-300 text-2xs">Email: <span className="text-sky-300 font-mono">jamkhednewsnetwork@gmail.com</span></p>
          </div>
        );
        break;

      case 'clear':
        setLogs([]);
        setInputVal('');
        return;

      default:
        outputNode = (
          <span className="text-rose-400 text-xs">
            command not found: "{trimmed}". Type <span className="text-emerald-400 font-bold underline cursor-pointer" onClick={() => executeCommand('help')}>help</span> for available commands.
          </span>
        );
    }

    setLogs(prev => [
      ...prev,
      {
        id: `cmd-${Date.now()}-${Math.random()}`,
        command: cmd,
        output: outputNode,
        timestamp: time
      }
    ]);
    setInputVal('');
  };

  const sampleArchitectureCode = `// Cricbuzz-Grade Edge Fan-Out & Read-Replica Sync (server.ts)
app.get("/api/cricket/live-feed", async (req, res) => {
  const now = Date.now();
  // 1.5s Edge Micro-Cache absorbs 100,000+ concurrent spectators
  res.setHeader("Cache-Control", "public, max-age=1, stale-while-revalidate=2");
  res.setHeader("X-FanOut-Tier", "edge-replica");

  if (cache.data.length > 0 && now - cache.timestamp < 1500) {
    if (req.headers["if-none-match"] === cache.etag) {
      return res.status(304).end(); // 304 Not Modified
    }
    return res.json({ source: "edge_cache", matches: cache.data });
  }

  // Fallback to origin Firestore snapshot only when stale
  const snapshot = await fetchOriginMatches();
  return res.json({ source: "origin_db", matches: snapshot });
});`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sampleArchitectureCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-slate-950 border border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[640px] text-left"
          id="developer-terminal-modal"
        >
          {/* Top Window Bar */}
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-xs font-mono font-bold text-slate-400">
                shubham@engineer-workstation:~ (zsh)
              </span>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl text-[11px] font-mono border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('cli')}
                className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border-none ${
                  activeTab === 'cli' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal size={12} />
                <span>CLI Terminal</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border-none ${
                  activeTab === 'code' ? 'bg-slate-800 text-sky-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 size={12} />
                <span>Architecture.ts</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border-none ${
                  activeTab === 'specs' ? 'bg-slate-800 text-purple-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cpu size={12} />
                <span>Stack Matrix</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer border-none"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body Section */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 font-mono text-xs text-slate-200">
            {activeTab === 'cli' && (
              <div className="space-y-3">
                <div className="text-slate-400 text-2xs leading-relaxed pb-2 border-b border-slate-900">
                  Type <span className="text-emerald-400 font-bold">help</span> or tap any quick-pill below to run commands in realtime.
                </div>

                {logs.map(log => (
                  <div key={log.id} className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400 text-2xs">
                      <span className="text-emerald-400 font-bold">shubham@cloud:~$</span>
                      <span className="text-slate-200 font-semibold">{log.command}</span>
                      <span className="text-slate-600 text-3xs ml-auto">{log.timestamp}</span>
                    </div>
                    <div className="pl-4 border-l border-slate-800/80">
                      {log.output}
                    </div>
                  </div>
                ))}

                {/* Active Prompt Line */}
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    executeCommand(inputVal);
                  }}
                  className="flex items-center gap-2 pt-1"
                >
                  <span className="text-emerald-400 font-bold shrink-0">shubham@cloud:~$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    placeholder="type 'skills', 'projects', 'stack', 'cricket', 'hire'..."
                    className="flex-1 bg-transparent border-none outline-none text-slate-100 font-mono text-xs focus:ring-0 placeholder:text-slate-600"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="p-1 rounded text-slate-500 hover:text-emerald-400 cursor-pointer border-none bg-transparent"
                  >
                    <CornerDownLeft size={13} />
                  </button>
                </form>
                <div ref={terminalEndRef} />
              </div>
            )}

            {activeTab === 'code' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-2xs text-slate-400">
                  <span className="text-sky-400 font-bold">// Production Snippet: Real-Time Edge Caching Architecture</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded text-2xs border-none cursor-pointer"
                  >
                    {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-sky-300 text-2xs leading-relaxed overflow-x-auto selection:bg-sky-500/30">
                  <code>{sampleArchitectureCode}</code>
                </pre>
                <p className="text-2xs text-slate-400">
                  Engineered to withstand sudden traffic spikes (e.g. over 100,000 spectators on match finals) while keeping Firestore read operations minimal.
                </p>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="space-y-3 text-2xs">
                <div className="pb-2 border-b border-slate-800 text-purple-400 font-bold">
                  // Certified Production Engineering Matrix
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-emerald-400 font-bold block mb-1">Frontend Engineering</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                      <li>React 19 + TypeScript (Strict)</li>
                      <li>Tailwind CSS + Motion 11</li>
                      <li>HTML5 Canvas 2D Graphic Engine</li>
                      <li>PWA & Service Worker Offline Caching</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-sky-400 font-bold block mb-1">Cloud & Realtime Backend</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                      <li>Firebase Firestore & Realtime DB</li>
                      <li>Node.js / Express Middleware</li>
                      <li>Google Cloud Run Containerized Deployment</li>
                      <li>IndexedDB Local Event Sourcing</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-amber-400 font-bold block mb-1">Hardware & Live Streaming</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                      <li>OBS Studio WebSocket API Integration</li>
                      <li>Thermal Slip ESC/POS Receipt Printing</li>
                      <li>Smart Camera Video Recorder & Overlay</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-purple-400 font-bold block mb-1">AI & Smart Automation</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                      <li>Google Gemini AI Function Calling</li>
                      <li>Automated Hindi/Marathi Multilingual Translation</li>
                      <li>Live Cricket Win Probability Engine</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Command Pills Footer */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 select-none">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-3xs uppercase font-bold text-slate-500 mr-1 hidden sm:inline">Run:</span>
              {['skills', 'projects', 'stack', 'stats', 'cricket', 'hire', 'clear'].map(cmd => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => executeCommand(cmd)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 text-2xs font-mono transition-colors cursor-pointer border-none"
                >
                  ${cmd}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                onClose();
                window.open('https://wa.me/7719959593', '_blank');
              }}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-2xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer border-none ml-auto"
            >
              <span>Connect on WhatsApp</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
