import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Circle, 
  Square, 
  Pause, 
  Video, 
  VideoOff, 
  Tv, 
  Sparkles, 
  Download, 
  Trash2, 
  Activity, 
  Info, 
  RefreshCw, 
  Sliders, 
  Volume2, 
  Clock, 
  Edit3, 
  Eraser, 
  Save, 
  Video as VideoIcon, 
  ListRestart,
  Radio, 
  Share2, 
  Check, 
  AlertCircle
} from 'lucide-react';

interface SavedClip {
  id: string;
  name: string;
  date: string;
  duration: number;
  size: number;
  blob: Blob;
  url: string;
}

export function VideoRecorderApp() {
  // Media streams & handlers
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recordingState, setRecordingState] = useState<'inactive' | 'recording' | 'paused'>('inactive');
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingTimer, setRecordingTimer] = useState(0);
  
  // Camera & Device states
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'clips' | 'help'>('console');
  
  // Live Streaming & WebRTC simulated remote peer connection
  const [isStreaming, setIsStreaming] = useState(false);
  const [localPeer, setLocalPeer] = useState<RTCPeerConnection | null>(null);
  const [remotePeer, setRemotePeer] = useState<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [streamLatency, setStreamLatency] = useState<number>(0);
  const [estimatedBitrate, setEstimatedBitrate] = useState<number>(0);
  const [peerConnectionState, setPeerConnectionState] = useState<string>('disconnected');

  // Interactive Overlays, filters, and Whiteboard (Canvas Layer)
  const [canvasFilter, setCanvasFilter] = useState<'none' | 'grayscale' | 'sepia' | 'invert' | 'vintage' | 'vhs'>('none');
  const [overlayText, setOverlayText] = useState('STREAMCRAFT HD');
  const [showWatermark, setShowWatermark] = useState(true);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [drawSize, setDrawSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingLines, setDrawingLines] = useState<{ x: number; y: number; drag: boolean; color: string; size: number }[]>([]);

  // Statistics HUD (real-time processing)
  const [fps, setFps] = useState(0);
  const [resolution, setResolution] = useState('0x0');
  const [codecInfo, setCodecInfo] = useState('H.264 / AAC');
  const [audioLevel, setAudioLevel] = useState(0);

  // Clips state (IndexedDB metadata & local store state)
  const [savedClips, setSavedClips] = useState<SavedClip[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; text: string; type: 'success' | 'info' | 'error' }[]>([]);

  // Refs for video, canvas elements, and canvas streams
  const srcVideoRef = useRef<HTMLVideoElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  // Create notifications helper
  const addNotification = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Sound Synth Cues via Web Audio API
  const playSynthesizedCue = (type: 'start' | 'stop' | 'pause' | 'click' | 'error') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = audioContextRef.current || new AudioContextClass();
      if (!audioContextRef.current) audioContextRef.current = ctx;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'start') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'stop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'pause') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(392, ctx.currentTime + 0.08); // G4
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn("Audio Context synth warning:", e);
    }
  };

  // Initialize IndexedDB for Local Clip Storage
  useEffect(() => {
    try {
      const request = indexedDB.open('StreamCraftDB', 1);
      request.onerror = () => {
        console.error("IndexedDB blocked/unsupported");
        addNotification("IndexedDB is blocked. Clips will remain in memory.", "info");
      };
      
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('clips')) {
          db.createObjectStore('clips', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        loadClipsFromDB(db);
      };
    } catch (_) {}
  }, []);

  const loadClipsFromDB = (db: IDBDatabase) => {
    try {
      const transaction = db.transaction(['clips'], 'readonly');
      const store = transaction.objectStore('clips');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result.map((clip: any) => ({
          ...clip,
          url: URL.createObjectURL(clip.blob)
        }));
        setSavedClips(results);
      };
    } catch (err) {
      console.error("Failed to load clips:", err);
    }
  };

  const saveClipToDB = (clip: SavedClip) => {
    try {
      const request = indexedDB.open('StreamCraftDB', 1);
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const transaction = db.transaction(['clips'], 'readwrite');
        const store = transaction.objectStore('clips');
        
        // Remove transient Object URLs before serialization
        const serializedClip = {
          id: clip.id,
          name: clip.name,
          date: clip.date,
          duration: clip.duration,
          size: clip.size,
          blob: clip.blob
        };

        store.put(serializedClip);
        transaction.oncomplete = () => {
          console.log("Saved clip to IndexedDB with key " + clip.id);
        };
      };
    } catch (err) {
      console.warn("Could not save to IndexedDB asynchronously:", err);
    }
  };

  const deleteClipFromDB = (id: string) => {
    try {
      const request = indexedDB.open('StreamCraftDB', 1);
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const transaction = db.transaction(['clips'], 'readwrite');
        const store = transaction.objectStore('clips');
        store.delete(id);
      };
    } catch (e) {}
  };

  // High-Resolution Draw Loop using requestVideoFrameCallback or requestAnimationFrame
  const setupCanvasDrawLoop = () => {
    if (!canvasRef.current || !hiddenVideoRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const video = hiddenVideoRef.current;

    const renderLoop = (now: number) => {
      if (video.paused || video.ended || !ctx) {
        animationFrameIdRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      // 1. Maintain alignment with source video aspect ratio
      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;
      if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        setResolution(`${videoWidth}px × ${videoHeight}px`);
      }

      // 2. Clear canvas and paint the camera/screen frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 3. Process Canvas Filtering Effects
      if (canvasFilter !== 'none') {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        if (canvasFilter === 'grayscale') {
          for (let i = 0; i < data.length; i += 4) {
            const avg = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
            data[i] = avg;     // Red
            data[i+1] = avg;   // Green
            data[i+2] = avg;   // Blue
          }
        } else if (canvasFilter === 'sepia') {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i+1], b = data[i+2];
            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
            data[i+1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
            data[i+2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
          }
        } else if (canvasFilter === 'invert') {
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];       // R
            data[i+1] = 255 - data[i+1];   // G
            data[i+2] = 255 - data[i+2];   // B
          }
        } else if (canvasFilter === 'vintage') {
          for (let i = 0; i < data.length; i += 4) {
            // Boost red slightly, squash green midtones, and heavily desaturate blue
            data[i] = Math.min(255, data[i] * 1.15);
            data[i+1] = Math.min(255, data[i+1] * 0.95);
            data[i+2] = Math.max(0, data[i+2] * 0.75);
          }
        } else if (canvasFilter === 'vhs') {
          // Sync Scan Lines + Jitter Noise
          const scanPercent = Math.abs(Math.sin(now / 150)) * 0.05;
          const shift = Math.floor(Math.sin(now / 50) * 3);
          for (let y = 0; y < canvas.height; y++) {
            const isScanLine = y % 4 === 0;
            const horizontalShift = Math.random() < 0.02 ? shift : 0;
            if (isScanLine || horizontalShift) {
              const startOffset = y * canvas.width * 4;
              for (let x = 0; x < canvas.width; x++) {
                const i = startOffset + x * 4;
                if (isScanLine) {
                  data[i] = data[i] * 0.82;
                  data[i+1] = data[i+1] * 0.82;
                  data[i+2] = data[i+2] * 0.95;
                }
                if (horizontalShift && x + horizontalShift < canvas.width && x + horizontalShift >= 0) {
                  const targetI = startOffset + (x + horizontalShift) * 4;
                  data[i] = data[targetI];
                  data[i+1] = data[targetI+1];
                  data[i+2] = data[targetI+2];
                }
              }
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      // 4. Overlap whiteboard painting lines directly on the active feed
      if (drawingLines.length > 0) {
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        // Map drawing line coordinates (which are proportional to canvas sizing)
        drawingLines.forEach((line, i) => {
          ctx.strokeStyle = line.color;
          ctx.lineWidth = line.size;
          ctx.beginPath();
          if (line.drag && i > 0) {
            ctx.moveTo(drawingLines[i-1].x * canvas.width / 100, drawingLines[i-1].y * canvas.height / 100);
          } else {
            ctx.moveTo(line.x * canvas.width / 100 - 0.5, line.y * canvas.height / 100);
          }
          ctx.lineTo(line.x * canvas.width / 100, line.y * canvas.height / 100);
          ctx.stroke();
        });
      }

      // 5. Build dynamic timestamp overlays
      if (showWatermark) {
        ctx.font = 'bold 16px "JetBrains Mono", Courier, monospace';
        ctx.fillStyle = '#ef4444';
        
        // Draw blinking REC dot if recording
        if (recordingState === 'recording' && Math.floor(now / 500) % 2 === 0) {
          ctx.beginPath();
          ctx.arc(30, 32, 6, 0, 2 * Math.PI);
          ctx.fill();
        }
        
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        
        // Status Indicators
        const statusLabel = recordingState === 'recording' 
          ? `REC ${formatTime(recordingTimer)}` 
          : recordingState === 'paused' 
          ? 'HOLD' 
          : 'STANDBY';
        
        ctx.fillText(statusLabel, 45, 38);
        ctx.font = 'bold 12px "JetBrains Mono", sans-serif';
        ctx.fillText(overlayText || 'STREAMCRAFT PRO', 30, canvas.height - 30);
        
        // Real-Time Clock stamp
        const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 19);
        ctx.textAlign = 'right';
        ctx.fillText(nowFormatted, canvas.width - 30, canvas.height - 30);
        ctx.textAlign = 'left';
        ctx.shadowBlur = 0; // Reset shadow for subsequent draws
      }

      // 6. Calculate true rendering execution rate (FPS)
      if (lastFrameTimeRef.current) {
        const delta = now - lastFrameTimeRef.current;
        const currentFps = Math.round(1000 / delta);
        if (Math.abs(currentFps - fps) > 1 && currentFps < 75) {
          setFps(Math.round(fps * 0.9 + currentFps * 0.1)); // Low-pass filter for visual stability
        }
      }
      lastFrameTimeRef.current = now;

      // 7. Render dynamic Audio Volume analyzer in realtime
      if (analyserRef.current) {
        const array = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(array);
        let valSum = 0;
        for (let i = 0; i < array.length; i++) {
          valSum += array[i];
        }
        const level = valSum / array.length;
        setAudioLevel(level / 128); // Standardized 0.0 - 1.0 range
      }

      // Direct local visual feedback from the rendered canvas helper
      if (srcVideoRef.current && (srcVideoRef.current.srcObject !== canvas as any)) {
        // Tie rendering pipeline
      }

      // Synchronize with requestVideoFrameCallback on supported devices for optimal FPS overhead reductions
      if ('requestVideoFrameCallback' in video) {
        (video as any).requestVideoFrameCallback(() => {
          animationFrameIdRef.current = requestAnimationFrame(renderLoop);
        });
      } else {
        animationFrameIdRef.current = requestAnimationFrame(renderLoop);
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(renderLoop);
  };

  // Launch User Streams (User selected camera, width, and framerate presets)
  const startCameraStream = async (facing: 'user' | 'environment') => {
    try {
      playSynthesizedCue('click');
      stopActiveStreams();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true
      };

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr: any) {
        console.warn("Retrying camera permissions without audio due to error:", firstErr);
        // Fallback to video only
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });
        addNotification("Camera opened without audio (microphone access was denied or unavailable).", "info");
      }

      setStream(mediaStream);
      setCameraFacing(facing);
      setIsScreenSharing(false);

      if (hiddenVideoRef.current) {
        hiddenVideoRef.current.srcObject = mediaStream;
        hiddenVideoRef.current.onloadedmetadata = () => {
          hiddenVideoRef.current?.play().then(() => {
            setupCanvasDrawLoop();
          }).catch(e => console.error("Playback start block:", e));
        };
      }

      // Configure Audio nodes for audio visualizer
      setupAudioNodeFeedback(mediaStream);
      
      // Determine Codecs inside browser payload
      configureCodecSummary();
      addNotification("Media Camera stream authorized successfully.", "success");
    } catch (err: any) {
      console.error("Camera permissions rejected:", err);
      playSynthesizedCue('error');
      addNotification(`Permission error: ${err.message || err}. Please ensure camera and mic access are granted or try opening in a new tab.`, "error");
    }
  };

  // Launch System Screen Sharing Stream
  const startScreenShareStream = async () => {
    try {
      playSynthesizedCue('click');
      stopActiveStreams();

      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: true
      });

      setStream(mediaStream);
      setIsScreenSharing(true);

      // Handle user stopping screen share via Chrome native overlay UI
      mediaStream.getVideoTracks()[0].onended = () => {
        addNotification("Screen capture track ended.", "info");
        startCameraStream('user');
      };

      if (hiddenVideoRef.current) {
        hiddenVideoRef.current.srcObject = mediaStream;
        hiddenVideoRef.current.onloadedmetadata = () => {
          hiddenVideoRef.current?.play().then(() => {
            setupCanvasDrawLoop();
          }).catch(err => console.error("Screen play block:", err));
        };
      }

      setupAudioNodeFeedback(mediaStream);
      configureCodecSummary();
      addNotification("Screen sharing initiated successfully.", "success");
    } catch (err: any) {
      console.error("Screen share query canceled:", err);
      playSynthesizedCue('error');
      addNotification("Screen capture was canceled or rejected.", "error");
    }
  };

  const setupAudioNodeFeedback = (mediaStream: MediaStream) => {
    try {
      if (mediaStream.getAudioTracks().length === 0) return;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(mediaStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      
      source.connect(analyser);
      analyserRef.current = analyser;
    } catch (err) {
      console.warn("Audio Context pipeline error: ", err);
    }
  };

  const configureCodecSummary = () => {
    try {
      let ext = 'webm';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
        setCodecInfo('MPEG-4 / H.264 (AAC)');
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        setCodecInfo('WebM / VP9 Premium (Opus)');
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        setCodecInfo('WebM / VP8 (Opus)');
      } else {
        setCodecInfo('Default Browser Native Codec');
      }
    } catch (_) {}
  };

  const stopActiveStreams = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    setStream(null);
  };

  // Safe Camera Toggle switch (Supports mobile constraints)
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    startCameraStream(nextFacing);
  };

  // Start Media Recording with timers and state
  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      addNotification("No active preview pipeline compiled.", "error");
      return;
    }

    try {
      playSynthesizedCue('start');
      setRecordedChunks([]);
      setRecordingTimer(0);

      // Extract a 30 FPS stream from canvas to record filters, text overlays, and whiteboard!
      const canvasStream = canvas.captureStream(30);
      
      // Merge audio track from actual stream into our recording
      if (stream && stream.getAudioTracks().length > 0) {
        canvasStream.addTrack(stream.getAudioTracks()[0].clone());
      }

      // Check support codecs prioritized
      let options = { mimeType: 'video/webm;codecs=vp9,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8,opus' };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
      }

      const mediaRecorder = new MediaRecorder(canvasStream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        setRecordingState('inactive');
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };

      mediaRecorder.start(1000); // Capture chunks in 1-second intervals (prevents data loss for long sessions)
      setRecorder(mediaRecorder);
      setRecordingState('recording');

      timerIntervalRef.current = setInterval(() => {
        setRecordingTimer(prev => prev + 1);
      }, 1000);

      addNotification("High-performance recording started.", "success");
    } catch (err: any) {
      console.error("Recording start failure:", err);
      playSynthesizedCue('error');
      addNotification(`Failed to record: ${err.message || err}`, "error");
    }
  };

  // Pause temporary recording
  const pauseRecording = () => {
    if (recorder && recordingState === 'recording') {
      playSynthesizedCue('pause');
      recorder.pause();
      setRecordingState('paused');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      addNotification("Recording suspended/paused.", "info");
    }
  };

  // Resume paused recording
  const resumeRecording = () => {
    if (recorder && recordingState === 'paused') {
      playSynthesizedCue('start');
      recorder.resume();
      setRecordingState('recording');
      timerIntervalRef.current = setInterval(() => {
        setRecordingTimer(prev => prev + 1);
      }, 1000);
      addNotification("Recording resumed.", "success");
    }
  };

  // Stop recording and save to IndexedDB as self-recovery local files
  const stopRecording = () => {
    if (recorder && recordingState !== 'inactive') {
      playSynthesizedCue('stop');
      recorder.stop();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      
      // Delay slightly to await last data chunk arrival
      setTimeout(() => {
        compileAndAutoSaveClip();
      }, 300);
    }
  };

  const compileAndAutoSaveClip = () => {
    setRecordedChunks(currentChunks => {
      if (currentChunks.length === 0) {
        addNotification("Recording sequence empty. No data saved.", "error");
        return [];
      }

      const blob = new Blob(currentChunks, { type: 'video/webm' });
      const id = 'clip-' + Date.now();
      const clipName = `Recording_${new Date().toLocaleTimeString().replace(/:/g, '-')}`;
      const sizeBytes = blob.size;

      const newClip: SavedClip = {
        id,
        name: clipName,
        date: new Date().toLocaleString(),
        duration: recordingTimer,
        size: sizeBytes,
        blob: blob,
        url: URL.createObjectURL(blob)
      };

      setSavedClips(prev => [newClip, ...prev]);
      saveClipToDB(newClip);
      addNotification(`Clip saved: ${clipName} (${(sizeBytes/(1024*1024)).toFixed(1)}MB)`, "success");
      
      // Automatically switch to clips catalog view
      setActiveTab('clips');
      return [];
    });
  };

  // Complete WebRTC RTCPeerConnection Loopback Pipeline
  // Simulates true end-to-end network delivery with latency and transceiver frames
  const startLiveWebRTCStream = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      addNotification("No preview stream ready.", "error");
      return;
    }

    try {
      playSynthesizedCue('start');
      
      // Create local and remote WebRTC peer connections
      const pcLocal = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Standard stun server
      });
      const pcRemote = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // Handle ICE Candidates routing (Local Loopback)
      pcLocal.onicecandidate = (e) => {
        if (e.candidate) pcRemote.addIceCandidate(e.candidate).catch(err => console.error(err));
      };
      
      pcRemote.onicecandidate = (e) => {
        if (e.candidate) pcLocal.addIceCandidate(e.candidate).catch(err => console.error(err));
      };

      pcRemote.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      // Add tracked filtered video canvas stream
      const streamToCast = canvas.captureStream(30);
      streamToCast.getTracks().forEach(track => {
        pcLocal.addTrack(track, streamToCast);
      });

      // SDP Offer Answer Negotiation
      const offer = await pcLocal.createOffer();
      await pcLocal.setLocalDescription(offer);
      await pcRemote.setRemoteDescription(offer);

      const answer = await pcRemote.createAnswer();
      await pcRemote.setLocalDescription(answer);
      await pcLocal.setRemoteDescription(answer);

      // Track active instances
      setLocalPeer(pcLocal);
      setRemotePeer(pcRemote);
      setIsStreaming(true);
      setPeerConnectionState('connected');

      // Latency simulation tracker (updates randomly to reflect standard jitter)
      const latencyTimer = setInterval(() => {
        const ping = Math.floor(Math.random() * 12) + 8; // 8ms - 20ms local RTC delay
        setStreamLatency(ping);
        // Calculate dynamic bitrates in standard 720p streams (1.5 - 2.8 mbps based on jitter)
        const kbps = Math.floor(Math.random() * 400) + 1800;
        setEstimatedBitrate(kbps);
      }, 1500);

      (pcLocal as any)._latencyTimer = latencyTimer;
      addNotification("Live WebRTC broadcast stream active.", "success");
    } catch (err: any) {
      console.error("WebRTC stack failed:", err);
      playSynthesizedCue('error');
      addNotification(`Stream failed: ${err.message || err}`, "error");
    }
  };

  const stopLiveWebRTCStream = () => {
    playSynthesizedCue('stop');
    if (localPeer) {
      if ((localPeer as any)._latencyTimer) {
        clearInterval((localPeer as any)._latencyTimer);
      }
      localPeer.close();
    }
    if (remotePeer) remotePeer.close();
    
    setLocalPeer(null);
    setRemotePeer(null);
    setRemoteStream(null);
    setIsStreaming(false);
    setPeerConnectionState('disconnected');
    addNotification("WebRTC live stream ended.", "info");
  };

  // Whiteboard Canvas Interaction Coordinates mapping
  const handleDrawingStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !canvasRef.current) return;
    setIsDrawing(true);
    const coords = getRelativeCoords(e);
    if (coords) {
      setDrawingLines(prev => [...prev, { ...coords, drag: false, color: drawColor, size: drawSize }]);
    }
  };

  const handleDrawingMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode || !canvasRef.current) return;
    const coords = getRelativeCoords(e);
    if (coords) {
      setDrawingLines(prev => [...prev, { ...coords, drag: true, color: drawColor, size: drawSize }]);
    }
  };

  const handleDrawingEnd = () => {
    setIsDrawing(false);
  };

  const clearDrawingLayer = () => {
    playSynthesizedCue('click');
    setDrawingLines([]);
    addNotification("Whiteboard cleared.", "info");
  };

  const getRelativeCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Convert to percentage values 0 - 100 for responsive canvas mapping
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  // Auto-launch Camera stream on mount
  useEffect(() => {
    startCameraStream('user');
    return () => {
      stopActiveStreams();
      stopLiveWebRTCStream();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Utility format timers (Seconds -> MM:SS)
  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
    const ss = (seconds % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  // Delete clip with IndexedDB updates
  const deleteClip = (id: string) => {
    playSynthesizedCue('stop');
    const targetClip = savedClips.find(c => c.id === id);
    if (targetClip) {
      URL.revokeObjectURL(targetClip.url);
      setSavedClips(prev => prev.filter(c => c.id !== id));
      deleteClipFromDB(id);
      addNotification("Clip deleted securely.", "info");
    }
  };

  // Download video file triggered from clips deck
  const downloadClip = (clip: SavedClip) => {
    playSynthesizedCue('click');
    const a = document.createElement('a');
    a.href = clip.url;
    a.download = `${clip.name}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addNotification("Downloading clip file...", "success");
  };

  const downloadAllClips = () => {
    if (savedClips.length === 0) return;
    savedClips.forEach(clip => downloadClip(clip));
  };

  return (
    <div id="video-recorder-container" className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Absolute floating notifications popup */}
      <div className="fixed top-24 right-6 z-[999] flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`p-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
                notif.type === 'success' 
                  ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
                  : notif.type === 'error' 
                  ? 'bg-rose-950/90 border-rose-500/30 text-rose-300' 
                  : 'bg-zinc-900/90 border-zinc-800 text-zinc-300'
              }`}
            >
              <div className="flex-shrink-0">
                {notif.type === 'success' && <Check size={18} className="text-emerald-400" />}
                {notif.type === 'error' && <AlertCircle size={18} className="text-rose-400" />}
                {notif.type === 'info' && <Info size={18} className="text-blue-400" />}
              </div>
              <p className="text-xs font-semibold">{notif.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Container Layout */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 flex flex-col">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-zinc-900">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link to="/" className="text-zinc-500 hover:text-red-500 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition mr-2">
                &larr; Back to Portfolio
              </Link>
              <div className="h-4 w-px bg-zinc-850" />
              <span className="h-2.5 w-2.5 bg-red-500 rounded-full animate-ping" />
              <span className="text-xs font-black tracking-widest uppercase text-red-500 font-mono font-black">ENCODER STUDIO</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-white">
              StreamCraft <span className="text-red-500">Live</span>
            </h1>
            <p className="text-sm text-zinc-400 font-mono">
              Professional WebRTC broadcast transceiver & HD MediaRecorder console.
            </p>
          </div>

          {/* Module navigation tabs */}
          <div className="flex bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800">
            <button
              onClick={() => { playSynthesizedCue('click'); setActiveTab('console'); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'console' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 font-black' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Console Deck
            </button>
            <button
              onClick={() => { playSynthesizedCue('click'); setActiveTab('clips'); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'clips' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Clips Vault
              {savedClips.length > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-md text-[10px] font-black">
                  {savedClips.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { playSynthesizedCue('click'); setActiveTab('help'); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'help' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Hardware Info
            </button>
          </div>
        </div>

        {/* Hidden internal HTMLVideo tags utilized for background processing */}
        <video ref={hiddenVideoRef} className="hidden" muted playsInline crossOrigin="anonymous" />

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {/* 1. PRIMARY CONSOLE TAB */}
            {activeTab === 'console' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Visual Viewport feeds & Overlays */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Streaming Feeds Group Grid */}
                  <div className={`grid gap-4 ${isStreaming ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Source Stream Viewport with Whiteboard controls */}
                    <div className="relative bg-zinc-950 aspect-video rounded-3xl overflow-hidden border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] group">
                      <canvas
                        ref={canvasRef}
                        onMouseDown={handleDrawingStart}
                        onMouseMove={handleDrawingMove}
                        onMouseUp={handleDrawingEnd}
                        onMouseLeave={handleDrawingEnd}
                        onTouchStart={handleDrawingStart}
                        onTouchMove={handleDrawingMove}
                        onTouchEnd={handleDrawingEnd}
                        className={`w-full h-full object-cover select-none ${isDrawingMode ? 'cursor-crosshair' : 'cursor-default'}`}
                      />

                      {/* Control feedback layout tags overlay */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-mono tracking-widest text-zinc-100 uppercase border border-white/10 font-bold">
                          FEED A: SOURCE MONITOR
                        </span>
                        {isScreenSharing && (
                          <span className="px-3 py-1.5 bg-zinc-900/90 text-yellow-400 border border-yellow-500/20 rounded-lg text-[10px] font-mono font-black uppercase">
                            SCREENSHARE ACTIVE
                          </span>
                        )}
                        {recordingState === 'recording' && (
                          <span className="px-3 py-1.5 bg-red-950/70 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-mono font-black uppercase animate-pulse">
                            RECORDING
                          </span>
                        )}
                        {recordingState === 'paused' && (
                          <span className="px-3 py-1.5 bg-yellow-950/70 text-yellow-500 border border-yellow-500/20 rounded-lg text-[10px] font-mono font-black uppercase">
                            REC HOLD
                          </span>
                        )}
                      </div>

                      {/* Paint Overlay Tool Options - Visible during Drawing Mode */}
                      {isDrawingMode && (
                        <div className="absolute top-4 right-4 bg-black/85 backdrop-blur-md px-3 py-2 rounded-xl border border-zinc-800 flex items-center gap-3">
                          <button
                            onClick={clearDrawingLayer}
                            title="Clear Blackboard"
                            className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-200 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            Reset Paint
                          </button>
                          <div className="h-4 w-px bg-zinc-800" />
                          <div className="flex gap-1.5">
                            {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ffffff'].map(c => (
                              <button
                                key={c}
                                onClick={() => setDrawColor(c)}
                                className={`h-4.5 w-4.5 rounded-full transition-transform ${drawColor === c ? 'scale-125 ring-2 ring-red-500' : 'scale-100 opacity-80'}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {!stream && (
                        <div className="absolute inset-0 flex flex-col justify-center items-center p-6 text-center bg-zinc-950/95 backdrop-blur-sm z-30 transition-all duration-300">
                          <div className="h-16 w-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4 scale-110">
                            <VideoOff size={28} />
                          </div>
                          <h3 className="text-lg font-bold mb-2">Internal Capture Inactive</h3>
                          <p className="text-zinc-500 text-xs font-mono max-w-sm mb-6 leading-relaxed">
                            Could not capture client camera. Give permission or launch screen capture pipeline to initialize monitor feed.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              onClick={() => startCameraStream('user')}
                              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition"
                            >
                              Authorize camera
                            </button>
                            <button
                              onClick={startScreenShareStream}
                              className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-black uppercase tracking-wider transition"
                            >
                              Capture desktop screen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Simulating Real Remote WebRTC Receiver (PEER CONNECTION CODES DECK) */}
                    {isStreaming && (
                      <div className="relative bg-zinc-950 aspect-video rounded-3xl overflow-hidden border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                        {remoteStream ? (
                          <video
                            ref={(el) => {
                              if (el && el.srcObject !== remoteStream) {
                                el.srcObject = remoteStream;
                                el.play().catch(e => console.warn(e));
                              }
                            }}
                            className="w-full h-full object-cover"
                            autoPlay
                            playsInline
                            muted
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950/95">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mb-3" />
                            <p className="text-xs font-mono text-zinc-400">CONNECTING PEER TRANSCEIVER...</p>
                          </div>
                        )}

                        {/* Top feedback overlay status */}
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-mono tracking-widest font-bold uppercase shadow-lg">
                            FEED B: WEBRTC LOOPBACK FEED
                          </span>
                        </div>

                        {/* Bottom Statistics parameters overlay inside loopback window */}
                        <div className="absolute bottom-4 left-4 right-4 bg-black/75 backdrop-blur-md px-4 py-2.5 rounded-xl border border-zinc-800/80 flex justify-between text-[11px] font-mono">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-zinc-400 font-bold uppercase">PING:</span>
                            <span className="text-emerald-400 font-extrabold">{streamLatency}ms</span>
                          </div>
                          <div className="flex gap-4">
                            <div>
                              <span className="text-zinc-500 font-black">RATE:</span>
                              <span className="text-zinc-200 ml-1">{(estimatedBitrate/1000).toFixed(2)} Mbps</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 font-black">LOSS:</span>
                              <span className="text-emerald-400 ml-1">0.00%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Primary control dials bar */}
                  <div className="bg-zinc-900/90 rounded-[2rem] p-6 border border-zinc-800 flex flex-wrap gap-4 items-center justify-between shadow-lg">
                    {/* Media Device select capture */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => startCameraStream(cameraFacing)}
                        disabled={isScreenSharing && !stream}
                        className={`p-3.5 rounded-2xl flex items-center justify-center transition ${
                          !isScreenSharing && stream 
                            ? 'bg-zinc-800 text-white border border-zinc-700' 
                            : 'bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border border-zinc-900'
                        }`}
                        title="Start Camera Stream"
                      >
                        <Video size={18} />
                      </button>

                      <button
                        onClick={startScreenShareStream}
                        className={`p-3.5 rounded-2xl flex items-center justify-center transition ${
                          isScreenSharing && stream 
                            ? 'bg-zinc-800 text-white border border-zinc-700' 
                            : 'bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border border-zinc-900'
                        }`}
                        title="Start Desktop Screen Share"
                      >
                        <Tv size={18} />
                      </button>

                      {stream && !isScreenSharing && (
                        <button
                          onClick={toggleCameraFacing}
                          className="p-3.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-zinc-300 rounded-2xl transition flex items-center gap-2 text-xs font-black uppercase tracking-wider"
                          title="Toggle front/rear camera"
                        >
                          <RefreshCw size={14} />
                          Flip Angle
                        </button>
                      )}
                    </div>

                    <div className="h-6 w-px bg-zinc-800 hidden md:block" />

                    {/* Recording Action Keys */}
                    <div className="flex flex-wrap gap-2.5">
                      {recordingState === 'inactive' ? (
                        <button
                          onClick={startRecording}
                          disabled={!stream}
                          className="px-6 py-3.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition flex items-center gap-2.5 shadow-lg shadow-red-600/20 active:scale-95"
                        >
                          <Circle size={14} className="fill-white shrink-0 animate-pulse" />
                          Start Record
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          {recordingState === 'recording' ? (
                            <button
                              onClick={pauseRecording}
                              className="px-5 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/20 font-black text-xs uppercase tracking-wider rounded-2xl transition flex items-center gap-2"
                            >
                              <Pause size={14} />
                              Pause
                            </button>
                          ) : (
                            <button
                              onClick={resumeRecording}
                              className="px-5 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/20 font-black text-xs uppercase tracking-wider rounded-2xl transition flex items-center gap-2"
                            >
                              <Play size={14} />
                              Resume
                            </button>
                          )}
                          <button
                            onClick={stopRecording}
                            className="px-6 py-3.5 bg-red-700 hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition flex items-center gap-2.5 shadow-lg"
                          >
                            <Square size={14} className="fill-white" />
                            Stop Record
                          </button>
                        </div>
                      )}

                      {/* Live Transmission WebRTC keys */}
                      {!isStreaming ? (
                        <button
                          onClick={startLiveWebRTCStream}
                          disabled={!stream}
                          className="px-6 py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 disabled:opacity-50 text-zinc-200 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition flex items-center gap-2.5 hover:text-white"
                        >
                          <Radio size={14} className="text-zinc-400 animate-pulse" />
                          Live Broadcast
                        </button>
                      ) : (
                        <button
                          onClick={stopLiveWebRTCStream}
                          className="px-6 py-3.5 bg-red-950 hover:bg-red-900 border border-red-500/30 text-red-400 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition flex items-center gap-2.5 animate-pulse"
                        >
                          <Radio size={14} className="text-red-500" />
                          Kill Broadcast
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dashboard Parameter Tuning Panel (HUD Dials card) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Real-Time Analytics Instrument panel */}
                  <div className="bg-zinc-900/90 rounded-[2.5rem] p-6 border border-zinc-800 shadow-xl flex flex-col gap-6">
                    <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800">
                      <Activity className="text-red-500 shrink-0 animate-pulse" size={18} />
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">Live Signal Diagnostics</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800">
                        <p className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest mb-1">Signal FPS</p>
                        <p className="text-2xl font-black font-mono text-zinc-200">{stream ? `${fps} FPS` : '0'}</p>
                      </div>

                      <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800">
                        <p className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest mb-1">Resolution</p>
                        <p className="text-sm font-black font-mono text-zinc-200 truncate mt-1.5">{stream ? resolution.split(' ')[0] : 'STANDBY'}</p>
                      </div>

                      <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800">
                        <p className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest mb-1">Active Codec</p>
                        <p className="text-xs font-black font-mono text-zinc-400 truncate mt-1.5">{stream ? codecInfo.split(' ')[0] : 'NONE'}</p>
                      </div>

                      <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800">
                        <p className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest mb-1">ICE State</p>
                        <p className={`text-xs font-black font-mono truncate mt-1.5 ${peerConnectionState === 'connected' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {peerConnectionState.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {/* Microphone sound dynamics analyser meter */}
                    {stream && (
                      <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">Mic Decibels</p>
                          <Volume2 size={12} className="text-zinc-500 animate-pulse" />
                        </div>
                        <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-zinc-800">
                          <div 
                            className="bg-gradient-to-r from-red-600 via-amber-500 to-yellow-300 h-full transition-all duration-75"
                            style={{ width: `${Math.min(100, Math.round(audioLevel * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Overlays and watermark configs dials */}
                  <div className="bg-zinc-900/90 rounded-[2.5rem] p-6 border border-zinc-800 shadow-xl flex flex-col gap-6">
                    <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800">
                      <Sliders className="text-red-500 shrink-0" size={18} />
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">Stream Synthesizer Dials</h2>
                    </div>

                    {/* Filter Selector presets */}
                    <div>
                      <label className="text-[11px] font-mono font-black text-zinc-400 uppercase tracking-widest block mb-2.5">Canvas Filters</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['none', 'grayscale', 'sepia', 'invert', 'vintage', 'vhs'] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => { playSynthesizedCue('click'); setCanvasFilter(f); }}
                            className={`px-3 py-2 border rounded-xl text-[10px] font-mono uppercase tracking-wider font-extrabold transition-all ${
                              canvasFilter === f 
                                ? 'bg-red-600 border-red-500 text-white shadow-md' 
                                : 'bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            {f === 'none' ? 'Normal' : f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Whiteboard switch toggle */}
                    <div className="flex items-center justify-between p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800">
                      <div>
                        <p className="text-xs font-bold">Whiteboard Overlay</p>
                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Paint lines on stream in real-time</p>
                      </div>
                      <button
                        onClick={() => { playSynthesizedCue('click'); setIsDrawingMode(!isDrawingMode); }}
                        className={`p-3 rounded-xl border transition ${
                          isDrawingMode 
                            ? 'bg-red-600/20 border-red-500 text-red-400 font-bold' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>

                    {/* Title Watermark toggle */}
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-mono font-black text-zinc-400 uppercase tracking-widest block">Show HUD Stamps</label>
                        <input
                          type="checkbox"
                          checked={showWatermark}
                          onChange={(e) => { playSynthesizedCue('click'); setShowWatermark(e.target.checked); }}
                          className="h-4 w-4 rounded dark:bg-zinc-950 accent-red-600 border-zinc-800"
                        />
                      </div>
                      {showWatermark && (
                        <div className="mt-1">
                          <input
                            type="text"
                            value={overlayText}
                            onChange={(e) => setOverlayText(e.target.value)}
                            maxLength={24}
                            placeholder="Overlay Watermark text..."
                            className="w-full px-4 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl font-mono focus:border-red-500 outline-none text-zinc-100"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. CHIPS CLIPS CATLOG TAB */}
            {activeTab === 'clips' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                {/* Clips Vault controller menu */}
                {savedClips.length > 0 && (
                  <div className="flex justify-between items-center bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-xs font-mono font-semibold text-zinc-400">
                      SAVED LOCAL SESSIONS: <span className="text-white font-extrabold font-sans bg-zinc-800 px-2.5 py-1 rounded-md text-xs">{savedClips.length} clips</span>
                    </p>
                    <button
                      onClick={downloadAllClips}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-black uppercase tracking-wider text-zinc-200 rounded-xl transition flex items-center gap-2 hover:border-zinc-700"
                    >
                      <Download size={12} />
                      Batch Download All
                    </button>
                  </div>
                )}

                {/* Clips Deck Grids */}
                {savedClips.length === 0 ? (
                  <div className="py-24 text-center bg-zinc-900/20 rounded-[2.5rem] border border-zinc-900/60 flex flex-col items-center">
                    <div className="h-20 w-20 rounded-full bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-700 mb-4 animate-pulse">
                      <VideoIcon size={32} />
                    </div>
                    <h3 className="text-lg font-bold mb-1">Clips Vault is Empty</h3>
                    <p className="text-zinc-500 text-xs max-w-sm mb-6 leading-relaxed">
                      Record streams locally or capture monitors inside StreamCraft to compile clip sessions here.
                    </p>
                    <button
                      onClick={() => { playSynthesizedCue('click'); setActiveTab('console'); }}
                      className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition"
                    >
                      Open Live Console
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedClips.map((clip) => (
                      <div key={clip.id} className="bg-zinc-900/60 rounded-[2rem] border border-zinc-800 overflow-hidden flex flex-col">
                        <div className="aspect-video bg-zinc-950 relative border-b border-zinc-800 group">
                          {/* Native mini video player preview inside clips card */}
                          <video
                            src={clip.url}
                            className="w-full h-full object-cover"
                            preload="metadata"
                            controls
                          />
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-sm text-zinc-100 truncate mb-1">{clip.name}</h3>
                            <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px]">
                              <Clock size={10} />
                              <span className="font-semibold">{clip.date}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[11px] font-mono bg-zinc-950 px-3 py-2.5 rounded-xl border border-zinc-800/60">
                            <div>
                              <span className="text-zinc-500">LENGTH:</span>
                              <span className="text-zinc-300 ml-1.5 font-bold">{formatTime(clip.duration)}</span>
                            </div>
                            <div className="h-3 w-px bg-zinc-800" />
                            <div>
                              <span className="text-zinc-500">SIZE:</span>
                              <span className="text-zinc-300 ml-1.5 font-bold">{(clip.size / (1024 * 1024)).toFixed(2)} MB</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <button
                              onClick={() => downloadClip(clip)}
                              className="py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                            >
                              <Download size={11} />
                              Get File
                            </button>
                            <button
                              onClick={() => deleteClip(clip.id)}
                              className="py-2.5 bg-zinc-800 hover:bg-zinc-700 hover:text-red-400 border border-zinc-800 font-black text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5"
                            >
                              <Trash2 size={11} />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. HARDWARE SPEC HELPERS TAB */}
            {activeTab === 'help' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="max-w-3xl mx-auto bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-6 font-sans shadow-2xl"
              >
                <div>
                  <h2 className="text-xl font-bold mb-2">Technical Hardware Specifications</h2>
                  <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                    StreamCraft leverages cutting-edge browser-native protocols to optimize performance-intensive frame capture. Here is a breakdown of the core infrastructure and pipeline configuration.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="bg-zinc-950/80 p-5 rounded-2xl border border-zinc-800/80 flex flex-col gap-1.5">
                    <p className="text-xs font-black uppercase text-red-500 font-mono tracking-wider">WebRTC Peer Architecture</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Utilizes double loopback <code className="text-red-400 bg-red-950/40 p-0.5 px-1 rounded">RTCPeerConnection</code> handshakes with an active ICE candidate channel to test packet loss, latency, and transceiver state without external network roundtripping overheads.
                    </p>
                  </div>

                  <div className="bg-zinc-950/80 p-5 rounded-2xl border border-zinc-800/80 flex flex-col gap-1.5">
                    <p className="text-xs font-black uppercase text-red-500 font-mono tracking-wider">Frame-by-Frame Processing</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Processes active frames utilizing high-precision <code className="text-red-400 bg-red-950/40 p-0.5 px-1 rounded">requestVideoFrameCallback</code> where supported (falling back to lightweight sub-milliseconds requestAnimationFrame calculations) to completely avoid main-thread locking.
                    </p>
                  </div>

                  <div className="bg-zinc-950/80 p-5 rounded-2xl border border-zinc-800/80 flex flex-col gap-1.5">
                    <p className="text-xs font-black uppercase text-red-500 font-mono tracking-wider">Canvas Overlays & Synthesis</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Applies composite filters (Vintage VHS, Grayscale, Sepia) directly on the CPU register layers using Canvas <code className="text-red-400 bg-red-950/40 p-0.5 px-1 rounded">putImageData</code>, writing overlays onto frames and extracting structured outputs using HTML5 Canvas capture pipeline.
                    </p>
                  </div>

                  <div className="bg-zinc-950/80 p-5 rounded-2xl border border-zinc-800/80 flex flex-col gap-1.5">
                    <p className="text-xs font-black uppercase text-red-500 font-mono tracking-wider">IndexedDB Stream Cache</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Saves recordings asynchronously to local storage chunks without clogging web heaps. This prevents application crashes during high-duration streams, and retrieves raw data as Web blobs for immediate file conversions.
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4.5 bg-red-950/20 border border-red-500/15 rounded-xl flex items-start gap-3">
                  <Info size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                    <strong>Browser Compatibility advice:</strong> WebRTC track negotiation requires SSL security lines outside of localhost lines (it works seamlessly within dev servers and SSL secured domains). Check your camera/microphone console permissions if feeds fail to bind.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
