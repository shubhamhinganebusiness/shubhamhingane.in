import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Trophy, 
  Award, 
  Flame, 
  Medal, 
  CheckCircle2, 
  Share2, 
  ExternalLink, 
  Search, 
  Copy, 
  Check, 
  ArrowLeft, 
  Calendar, 
  Sparkles,
  Zap,
  Lock,
  QrCode,
  Camera,
  Upload,
  Download,
  FileText,
  Crown,
  X,
  Loader2,
  Database
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { jsPDF } from 'jspdf';
import { 
  AwardType, 
  VerifiedAwardDetails,
  generateCertificateSerial, 
  lookupCertificateBySerial,
  getRecentIssuedCertificates,
  buildCertificateVerificationUrl
} from '../utils/certificateVerification';
import { generateCertificateCanvas } from '../components/cricket/MatchAwardsCertificateModal';

export const CertificateVerificationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL parameters from scanned QR code
  const certIdParam = searchParams.get('certId') || '';
  const matchIdParam = searchParams.get('m') || searchParams.get('matchId') || '';
  const awardParam = (searchParams.get('a') || searchParams.get('award') || 'potm') as AwardType;
  const playerParam = searchParams.get('p') || searchParams.get('player') || '';
  const runsParam = parseInt(searchParams.get('r') || searchParams.get('runs') || '0', 10);
  const ballsParam = searchParams.get('b') ? parseInt(searchParams.get('b')!, 10) : undefined;
  const foursParam = searchParams.get('f4') ? parseInt(searchParams.get('f4')!, 10) : undefined;
  const sixesParam = searchParams.get('s6') ? parseInt(searchParams.get('s6')!, 10) : undefined;
  const wicketsParam = parseInt(searchParams.get('w') || searchParams.get('wickets') || '0', 10);
  const runsConcededParam = searchParams.get('rc') ? parseInt(searchParams.get('rc')!, 10) : undefined;
  const ptsParam = parseInt(searchParams.get('pts') || searchParams.get('points') || '0', 10);
  const teamAParam = searchParams.get('ta') || searchParams.get('teamA') || '';
  const teamBParam = searchParams.get('tb') || searchParams.get('teamB') || '';
  const winnerParam = searchParams.get('win') || searchParams.get('winner') || '';
  const dateParam = searchParams.get('d') || searchParams.get('date') || '';
  const tournParam = searchParams.get('t') || searchParams.get('tournament') || '';
  const venueParam = searchParams.get('v') || searchParams.get('venue') || '';

  // Manual search & registry lookup state
  const [manualCertId, setManualCertId] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupSource, setLookupSource] = useState<'url' | 'cloud_registry' | 'match_archive' | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [resolvedRecord, setResolvedRecord] = useState<VerifiedAwardDetails | null>(null);
  const [recentCerts, setRecentCerts] = useState<VerifiedAwardDetails[]>([]);

  // Copy & export states
  const [copiedSerial, setCopiedSerial] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Live Camera & Image QR Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Load recent certificates from local registry on mount
  useEffect(() => {
    setRecentCerts(getRecentIssuedCertificates().slice(0, 6));
  }, [resolvedRecord]);

  // Compute or validate serial code
  const activeCertId = useMemo(() => {
    if (resolvedRecord?.certId) return resolvedRecord.certId.toUpperCase();
    if (certIdParam) return certIdParam.trim().toUpperCase();
    if (playerParam) {
      return generateCertificateSerial(matchIdParam || 'M07', dateParam || '2026', awardParam, playerParam);
    }
    return 'GS-2026-M07-POTM-8F2B';
  }, [resolvedRecord, certIdParam, matchIdParam, dateParam, awardParam, playerParam]);

  // Perform real database & match archive lookup whenever certIdParam changes
  useEffect(() => {
    let isMounted = true;
    const targetId = certIdParam.trim().toUpperCase();
    if (!targetId) {
      setResolvedRecord(null);
      setLookupSource(playerParam ? 'url' : null);
      return;
    }

    const runLookup = async () => {
      setIsLookingUp(true);
      setLookupError(null);
      try {
        const found = await lookupCertificateBySerial(targetId);
        if (!isMounted) return;
        if (found) {
          setResolvedRecord(found);
          setLookupSource('cloud_registry');
        } else if (playerParam && playerParam !== 'Verified Player') {
          // URL already contains full embedded parameters from QR code
          setResolvedRecord(null);
          setLookupSource('url');
        } else {
          setResolvedRecord(null);
          setLookupSource('match_archive');
          setLookupError(`No archived match record found for ID "${targetId}", showing decoded serial metadata.`);
        }
      } catch (err) {
        if (isMounted) {
          setLookupSource('url');
        }
      } finally {
        if (isMounted) {
          setIsLookingUp(false);
        }
      }
    };

    runLookup();
    return () => {
      isMounted = false;
    };
  }, [certIdParam, playerParam]);

  // Effective fields combining resolved database record with URL parameters
  const effectiveAward: AwardType = resolvedRecord?.awardType || awardParam || 'potm';
  const effectivePlayer = resolvedRecord?.playerName || playerParam || 'Star Champion';
  const effectiveRuns = resolvedRecord ? resolvedRecord.runs : runsParam;
  const effectiveBalls = resolvedRecord?.balls !== undefined ? resolvedRecord.balls : ballsParam;
  const effectiveFours = resolvedRecord?.fours !== undefined ? resolvedRecord.fours : foursParam;
  const effectiveSixes = resolvedRecord?.sixes !== undefined ? resolvedRecord.sixes : sixesParam;
  const effectiveWickets = resolvedRecord ? resolvedRecord.wickets : wicketsParam;
  const effectiveRunsConceded = resolvedRecord?.runsConceded !== undefined ? resolvedRecord.runsConceded : runsConcededParam;
  const effectivePoints = resolvedRecord?.points || ptsParam || Math.max(effectiveRuns + effectiveWickets * 25, 45);
  const effectiveTeamA = resolvedRecord?.teamA || teamAParam || 'Team A';
  const effectiveTeamB = resolvedRecord?.teamB || teamBParam || 'Team B';
  const effectiveWinner = resolvedRecord?.winner || winnerParam || '';
  const effectiveDate = resolvedRecord?.matchDate || dateParam || 'Official Match Date';
  const effectiveTournament = resolvedRecord?.tournamentName || tournParam || 'Gully Premier League 2026';
  const effectiveVenue = resolvedRecord?.venue || venueParam || 'Official Championship Ground';
  const effectiveMatchId = resolvedRecord?.matchId || matchIdParam || 'M07';

  // Award config mapping supporting all Match, Season, Squad, and Official awards
  const awardConfig = useMemo(() => {
    switch (effectiveAward) {
      case 'fighter':
        return {
          title: 'FIGHTER OF THE MATCH',
          marathi: 'झुंजार खेळाडू (Fighter of the Match)',
          badge: 'RUNNER-UP STANDOUT FIGHTER',
          description: 'Standout valiant performance from the runner-up team',
          icon: Zap,
          accentBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          gradient: 'from-rose-500 via-pink-500 to-amber-500'
        };
      case 'best_batter':
        return {
          title: 'BEST BATSMAN OF THE MATCH',
          marathi: 'उत्कृष्ट फलंदाज (Best Batsman)',
          badge: 'POWER STRIKER',
          description: 'Highest run contribution and match impact with the bat',
          icon: Flame,
          accentBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          gradient: 'from-orange-500 via-amber-500 to-yellow-500'
        };
      case 'best_bowler':
        return {
          title: 'BEST BOWLER OF THE MATCH',
          marathi: 'उत्कृष्ट गोलंदाज (Best Bowler)',
          badge: 'GOLDEN ARM BOWLER',
          description: 'Most destructive wicket-taking spell and bowling control',
          icon: Medal,
          accentBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          gradient: 'from-cyan-500 via-teal-500 to-emerald-500'
        };
      case 'man_of_series':
        return {
          title: 'MAN OF THE SERIES (MVP)',
          marathi: 'मालिकावीर मानकरी (Player of the Tournament)',
          badge: 'TOURNAMENT SUPREME MVP',
          description: 'Supreme all-round dominance across the entire championship series',
          icon: Crown,
          accentBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          gradient: 'from-amber-400 via-yellow-300 to-orange-500'
        };
      case 'orange_cap':
        return {
          title: 'ORANGE CAP WINNER',
          marathi: 'ऑरेंज कॅप मानकरी (Leading Run Scorer)',
          badge: 'TOURNAMENT TOP RUN SCORER',
          description: 'Highest aggregate runs scored across the tournament season',
          icon: Flame,
          accentBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          gradient: 'from-orange-500 via-amber-400 to-yellow-400'
        };
      case 'purple_cap':
        return {
          title: 'PURPLE CAP WINNER',
          marathi: 'पर्पल कॅप मानकरी (Leading Wicket Taker)',
          badge: 'TOURNAMENT TOP WICKET TAKER',
          description: 'Most wickets taken across the tournament season',
          icon: Medal,
          accentBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          gradient: 'from-purple-500 via-indigo-500 to-pink-500'
        };
      case 'best_fielder':
        return {
          title: 'BEST FIELDER OF THE TOURNAMENT',
          marathi: 'उत्कृष्ट क्षेत्ररक्षक (Best Fielder)',
          badge: 'ELECTRIC FIELDING EXCELLENCE',
          description: 'Exceptional catches, run-outs, and boundary saves',
          icon: Zap,
          accentBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          gradient: 'from-emerald-400 via-teal-400 to-cyan-400'
        };
      case 'emerging_player':
        return {
          title: 'EMERGING PLAYER AWARD',
          marathi: 'उदयोन्मुख खेळाडू (Emerging Star)',
          badge: 'RISING CHAMPION STAR',
          description: 'Breakout young talent demonstrating exceptional temperament',
          icon: Sparkles,
          accentBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          gradient: 'from-sky-400 via-blue-400 to-indigo-400'
        };
      case 'umpire':
        return {
          title: 'OFFICIAL MATCH UMPIRE CITATION',
          marathi: 'अधिकृत पंच गौरव प्रमाणपत्र (Match Official)',
          badge: 'FAIR PLAY & OFFICIATING HONOR',
          description: 'Presented for upholding the laws of cricket and impartial officiating',
          icon: ShieldCheck,
          accentBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          gradient: 'from-amber-400 via-yellow-400 to-emerald-400'
        };
      case 'scorer':
        return {
          title: 'OFFICIAL DIGITAL SCORER CITATION',
          marathi: 'अधिकृत गुणलेखक गौरव प्रमाणपत्र (Official Scorer)',
          badge: 'PRECISION BROADCAST ANALYST',
          description: 'Presented for ball-by-ball digital scoring and statistical accuracy',
          icon: Award,
          accentBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          gradient: 'from-cyan-400 via-blue-400 to-indigo-400'
        };
      case 'champion_squad':
        return {
          title: 'TOURNAMENT CHAMPION WINNER',
          marathi: 'सामना विजेता गौरव प्रमाणपत्र (Winning Squad)',
          badge: 'CHAMPION SQUAD MEMBER',
          description: 'Honored member of the championship winning squad',
          icon: Trophy,
          accentBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          gradient: 'from-amber-500 via-yellow-400 to-amber-600'
        };
      case 'runner_up_squad':
      case 'participation':
        return {
          title: 'OFFICIAL PARTICIPANT & FINALIST CITATION',
          marathi: 'सहभाग गौरव प्रमाणपत्र (Official Participant)',
          badge: 'CERTIFIED SQUAD CONTENDER',
          description: 'Honored for commendable sportsmanship and competitive spirit',
          icon: Medal,
          accentBg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          gradient: 'from-teal-400 via-emerald-400 to-cyan-400'
        };
      case 'potm':
      default:
        return {
          title: 'PLAYER OF THE MATCH',
          marathi: 'सामनावीर मानकरी (Man of the Match)',
          badge: 'MATCH WINNER & GAME DECIDER',
          description: 'Outstanding all-round contribution and match-winning performance',
          icon: Trophy,
          accentBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          gradient: 'from-amber-500 via-yellow-400 to-amber-600'
        };
    }
  }, [effectiveAward]);

  // Apply decoded QR text (either full verification URL or raw serial number)
  const applyDecodedQrValue = (decodedText: string) => {
    const clean = decodedText.trim();
    if (!clean) return;
    try {
      if (clean.startsWith('http://') || clean.startsWith('https://') || clean.includes('verify-certificate')) {
        const url = new URL(clean, window.location.origin);
        const params = new URLSearchParams(url.search);
        if (params.toString()) {
          setSearchParams(params);
          setIsScannerOpen(false);
          return;
        }
      }
    } catch (_) {}

    // Treat as raw serial ID
    const serial = clean.toUpperCase();
    setManualCertId(serial);
    setSearchParams({ certId: serial });
    setIsScannerOpen(false);
  };

  // Start / Stop Live Camera QR Scanner
  const startCameraScanner = async () => {
    setScannerError(null);
    setIsScannerOpen(true);
    setTimeout(async () => {
      try {
        if (html5QrCodeRef.current) {
          await html5QrCodeRef.current.stop().catch(() => {});
        }
        const scanner = new Html5Qrcode('qr-live-reader-region');
        html5QrCodeRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            scanner.stop().catch(() => {});
            html5QrCodeRef.current = null;
            applyDecodedQrValue(decodedText);
          },
          () => {}
        );
      } catch (err: any) {
        setScannerError('Camera access unavailable or denied. You can also upload a certificate image or QR screenshot below.');
      }
    }, 150);
  };

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current) {
      await html5QrCodeRef.current.stop().catch(() => {});
      html5QrCodeRef.current = null;
    }
    setIsScannerOpen(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Decode QR from uploaded image file
  const handleScanImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScannerError(null);
    try {
      const scanner = new Html5Qrcode('qr-hidden-file-reader');
      const decodedText = await scanner.scanFile(file, false);
      applyDecodedQrValue(decodedText);
    } catch (err) {
      setScannerError('Could not detect a valid QR code in the uploaded image. Please try a clearer image or enter the Certificate ID manually.');
    } finally {
      e.target.value = '';
    }
  };

  // Direct 300-DPI PDF or PNG Download from Verification Page
  const handleDirectDownload = async (format: 'pdf' | 'png') => {
    if (isExportingPdf || isExportingPng) return;
    try {
      if (format === 'pdf') setIsExportingPdf(true);
      else setIsExportingPng(true);

      const vUrl = buildCertificateVerificationUrl(activeCertId, {
        matchId: effectiveMatchId,
        awardType: effectiveAward,
        playerName: effectivePlayer,
        runs: effectiveRuns,
        balls: effectiveBalls,
        fours: effectiveFours,
        sixes: effectiveSixes,
        wickets: effectiveWickets,
        runsConceded: effectiveRunsConceded,
        points: effectivePoints,
        teamA: effectiveTeamA,
        teamB: effectiveTeamB,
        winner: effectiveWinner,
        matchDate: effectiveDate,
        tournamentName: effectiveTournament,
        venue: effectiveVenue
      });

      const canvas = await generateCertificateCanvas({
        data: {
          matchId: effectiveMatchId,
          tournamentName: effectiveTournament,
          matchDate: effectiveDate,
          teamA: effectiveTeamA,
          teamB: effectiveTeamB,
          winner: effectiveWinner,
          venue: effectiveVenue,
          playerOfTheMatch: {
            name: effectivePlayer,
            runs: effectiveRuns,
            balls: effectiveBalls,
            fours: effectiveFours,
            sixes: effectiveSixes,
            wickets: effectiveWickets,
            runsConceded: effectiveRunsConceded,
            points: effectivePoints
          }
        },
        selectedAward: effectiveAward,
        recipient: {
          name: effectivePlayer,
          runs: effectiveRuns,
          balls: effectiveBalls,
          fours: effectiveFours,
          sixes: effectiveSixes,
          wickets: effectiveWickets,
          runsConceded: effectiveRunsConceded,
          points: effectivePoints
        },
        tournamentName: effectiveTournament,
        organizerName: 'Shubham Hingane',
        sponsorName: 'Founder of Gully Scoreboard',
        federationName: 'Gully Scoreboard Team',
        themeId: 'classic_ivory',
        verificationUrl: vUrl,
        serialNumber: activeCertId,
        awardConfig: {
          en: awardConfig.title,
          mr: awardConfig.marathi,
          badge: awardConfig.badge
        },
        customAssets: {
          playerPhotoUrl: resolvedRecord?.playerPhotoUrl,
          teamLogoUrl: resolvedRecord?.teamLogoUrl,
          signatureImageUrl: resolvedRecord?.signatureImageUrl
        }
      });

      const safeName = effectivePlayer.replace(/[^a-zA-Z0-9_-]/g, '_');

      if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
        pdf.save(`Verified_GullyScore_Certificate_${safeName}.pdf`);
        setExportMessage('Official A4 PDF Downloaded!');
      } else {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `Verified_GullyScore_Certificate_${safeName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExportMessage('300-DPI PNG Downloaded!');
      }
      setTimeout(() => setExportMessage(null), 3000);
    } catch (err) {
      console.error('Failed to download verified certificate:', err);
    } finally {
      setIsExportingPdf(false);
      setIsExportingPng(false);
    }
  };

  const handleCopySerial = () => {
    navigator.clipboard.writeText(activeCertId);
    setCopiedSerial(true);
    setTimeout(() => setCopiedSerial(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Verified Gully Scoreboard Award - ${effectivePlayer}`,
        text: `Verified Genuine Gully Scoreboard Award: ${awardConfig.title} presented to ${effectivePlayer} (${activeCertId})`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCertId.trim()) return;
    const clean = manualCertId.trim().toUpperCase();
    setSearchParams({ certId: clean });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 md:p-8 font-sans selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Hidden container for image file QR scanning */}
      <div id="qr-hidden-file-reader" className="hidden" />

      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-amber-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-2xl relative z-10 space-y-4 sm:space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
          <Link
            to="/live/cricket-details"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Live Scoreboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
              Live Verified Registry
            </span>
          </div>
        </div>

        {/* 1. Official Verification Hero Badge */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden text-center">
          {/* Top security seal glow */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-1 shadow-xl flex items-center justify-center relative mb-4">
            <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
              {resolvedRecord?.playerPhotoUrl ? (
                <img
                  src={resolvedRecord.playerPhotoUrl}
                  alt={effectivePlayer}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <ShieldCheck size={40} className="text-emerald-400 drop-shadow-md" />
              )}
            </div>
            <div className="absolute -bottom-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[8px] font-black uppercase tracking-widest shadow-sm">
              VERIFIED
            </div>
          </div>

          {/* EXACT REQUESTED PHRASE: "Verified Genuine Gully Scoreboard Award" */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-black uppercase tracking-wider mb-2 shadow-xs">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>Verified Genuine Gully Scoreboard Award</span>
          </div>

          {lookupSource === 'cloud_registry' && (
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1">
              <Database size={11} />
              <span>Matched in Official Cloud & Match Registry</span>
            </div>
          )}

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight uppercase font-serif mt-1">
            Official Certification Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-1.5 leading-relaxed">
            This digital certificate has been cryptographically validated and confirmed genuine in the central Gully Scoreboard match registry.
          </p>

          {/* Official Verification Serial Number */}
          <div className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-amber-500/40 max-w-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
            <div className="text-left w-full sm:w-auto">
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                Certificate Verification Serial Number
              </span>
              <span className="font-mono text-sm sm:text-base font-black text-amber-300 tracking-wider select-all block">
                {isLookingUp ? 'SEARCHING REGISTRY...' : activeCertId}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopySerial}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer shrink-0"
              title="Copy serial number"
            >
              {copiedSerial ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedSerial ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>

          {lookupError && (
            <p className="text-[11px] text-amber-300/90 mt-2 font-medium">
              {lookupError}
            </p>
          )}
        </div>

        {/* 2. Honored Player & Match Breakdown Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
          {/* Award Category Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              {resolvedRecord?.teamLogoUrl ? (
                <img
                  src={resolvedRecord.teamLogoUrl}
                  alt="Team Crest"
                  className="w-10 h-10 rounded-full object-contain bg-white p-0.5 border border-amber-500/40"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black shadow-xs">
                  {React.createElement(awardConfig.icon, { size: 20 })}
                </div>
              )}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  Official Championship Citation
                </span>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {awardConfig.title}
                </h2>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${awardConfig.accentBg}`}>
              {awardConfig.badge}
            </span>
          </div>

          {/* Recipient Details */}
          <div className="text-center py-2 space-y-1.5">
            <span className="text-xs uppercase font-medium tracking-widest text-slate-400 font-serif italic">
              Accolade Awarded To
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-amber-300 tracking-tight uppercase font-serif drop-shadow-sm">
              {effectivePlayer}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {awardConfig.description}
            </p>
          </div>

          {/* Match Clash Context */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Match Contest
              </span>
              <p className="text-sm font-black text-white mt-0.5">
                {effectiveTeamA} <span className="text-amber-400 font-bold">vs</span> {effectiveTeamB}
              </p>
              {effectiveWinner && (
                <span className="text-xs font-semibold text-emerald-400 block mt-0.5">
                  Result: {effectiveWinner}
                </span>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Tournament & Date
              </span>
              <p className="text-xs font-bold text-amber-300 mt-0.5">
                {effectiveTournament}
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center justify-center sm:justify-end gap-1">
                <Calendar size={11} /> {effectiveDate}
              </p>
            </div>
          </div>

          {/* Verified Stats Highlight Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
            <div className="bg-slate-950/90 rounded-2xl p-3 text-center border border-slate-800/90">
              <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">
                Runs Scored
              </span>
              <strong className="text-lg sm:text-2xl font-black font-mono text-emerald-400 block mt-0.5">
                {effectiveRuns}
              </strong>
              <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                {effectiveBalls ? `${effectiveBalls} balls` : 'Impact Inning'}
                {effectiveFours || effectiveSixes ? ` (${effectiveFours || 0}x4, ${effectiveSixes || 0}x6)` : ''}
              </span>
            </div>

            <div className="bg-slate-950/90 rounded-2xl p-3 text-center border border-slate-800/90">
              <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">
                Wickets Taken
              </span>
              <strong className="text-lg sm:text-2xl font-black font-mono text-cyan-400 block mt-0.5">
                {effectiveWickets}
              </strong>
              <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                {effectiveRunsConceded !== undefined ? `${effectiveRunsConceded} runs` : 'Bowling Spell'}
              </span>
            </div>

            <div className="bg-slate-950/90 rounded-2xl p-3 text-center border border-slate-800/90">
              <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">
                MVP Rating
              </span>
              <strong className="text-lg sm:text-2xl font-black font-mono text-amber-300 block mt-0.5">
                {effectivePoints} pts
              </strong>
              <span className="text-[9px] text-amber-400 font-bold uppercase block mt-0.5">
                Game Decider
              </span>
            </div>
          </div>

          {/* Official Signatories & Authenticity Seal */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-amber-500/40 bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                  Certifying Authority
                </span>
                {resolvedRecord?.signatureImageUrl ? (
                  <img
                    src={resolvedRecord.signatureImageUrl}
                    alt="Official Signature"
                    className="h-6 object-contain my-0.5"
                  />
                ) : (
                  <p className="text-xs font-serif italic font-bold text-amber-300">
                    Shubham Hingane
                  </p>
                )}
                <p className="text-[9.5px] text-slate-400">
                  Founder of Gully Scoreboard • Gully Scoreboard Team
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                <ShieldCheck size={12} /> Digital Tamper-Proof
              </span>
              <span className="block text-[8.5px] text-slate-400 font-mono mt-1">
                SHA256: {activeCertId}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Direct Certificate PDF & PNG Download + Share Toolbar */}
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-3xl p-4 sm:p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Download size={13} />
              Instant 300-DPI Certificate Reprint & Export
            </span>
            {exportMessage && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Check size={13} /> {exportMessage}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isExportingPdf}
              onClick={() => handleDirectDownload('pdf')}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              <span>{isExportingPdf ? 'Rendering A4 PDF...' : 'Download Official PDF'}</span>
            </button>

            <button
              type="button"
              disabled={isExportingPng}
              onClick={() => handleDirectDownload('png')}
              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/40 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isExportingPng ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span>{isExportingPng ? 'Rendering PNG...' : 'Download 300-DPI PNG'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleShare}
              className="py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              {copiedShare ? <Check size={15} /> : <Share2 size={15} />}
              <span>{copiedShare ? 'Link Copied!' : 'Share Verified Award'}</span>
            </button>

            <Link
              to={`/live/cricket-details${effectiveMatchId ? `?match=${effectiveMatchId}` : ''}`}
              className="py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-slate-700"
            >
              <ExternalLink size={15} />
              <span>Open Match Scorecard</span>
            </Link>
          </div>
        </div>

        {/* 4. Live Camera QR Scanner & Manual Certificate ID Registry Lookup */}
        <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <QrCode size={15} className="text-amber-400" />
              Verify by QR Scanner or Certificate ID
            </span>

            <div className="flex items-center gap-2">
              {!isScannerOpen ? (
                <button
                  type="button"
                  onClick={startCameraScanner}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Camera size={13} />
                  <span>Live Camera QR Scan</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCameraScanner}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <X size={13} />
                  <span>Close Camera</span>
                </button>
              )}

              <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all">
                <Upload size={13} className="text-emerald-400" />
                <span>Scan Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleScanImageFile}
                />
              </label>
            </div>
          </div>

          {/* Live Camera QR Reader Viewport */}
          {isScannerOpen && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2">
              <div
                id="qr-live-reader-region"
                className="w-full max-w-xs mx-auto overflow-hidden rounded-xl"
              />
              <p className="text-[11px] text-center text-slate-400">
                Point your camera at the QR code on the bottom of any printed or digital Gully Scoreboard certificate.
              </p>
            </div>
          )}

          {scannerError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {scannerError}
            </div>
          )}

          {/* Manual Serial Input Form */}
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={manualCertId}
                onChange={(e) => setManualCertId(e.target.value)}
                placeholder="Enter Certificate ID (e.g. GS-2026-M07-POTM-8F2B)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLookingUp}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0"
            >
              {isLookingUp ? 'Checking...' : 'Verify ID'}
            </button>
          </form>

          {/* Recently Issued Certificates in Registry */}
          {recentCerts.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Recently Issued Certificates in Registry:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recentCerts.map((rc) => (
                  <button
                    key={rc.certId}
                    type="button"
                    onClick={() => {
                      setManualCertId(rc.certId);
                      setSearchParams({ certId: rc.certId });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      activeCertId === rc.certId
                        ? 'bg-amber-500/15 border-amber-500/50 text-white'
                        : 'bg-slate-950/70 border-slate-800/90 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="truncate">
                      <span className="text-xs font-black text-amber-300 block truncate">
                        {rc.playerName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block truncate">
                        {rc.certId}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[9px] font-bold uppercase text-emerald-400 shrink-0">
                      {rc.awardType.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-center text-slate-400">
          Gully Scoreboard Championship Certification Service • Powered by GullyScore Official
        </p>

      </div>
    </div>
  );
};

export default CertificateVerificationPage;
