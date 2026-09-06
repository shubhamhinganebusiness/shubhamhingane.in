import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Phone,
  Mail,
  Check,
  Search,
  Award,
  Trash2,
  ListFilter,
  CheckCircle2,
  Users,
  Sparkles,
  ShieldCheck,
  FileDown,
  Trophy,
  ShieldX,
  Plus,
  Tv,
  ArrowUpRight,
  TrendingUp,
  Star,
  MoreVertical,
  Activity,
  Calendar,
  X,
  Lock,
  Info,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  SlidersHorizontal,
  Share2
} from "lucide-react";
import { db, handleFirestoreError, OperationType, isFirestoreQuotaExhausted, isQuotaError, recordFirestoreQuotaExhaustion } from "../../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { CricketPlayer } from "./PlayerRegistrationForm";
import { useAuth } from "../AuthContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend
} from "recharts";

interface PlayerDirectoryDashboardProps {
  onAddToTeam?: (player: CricketPlayer, team: "A" | "B") => void;
  showTeamSelectors?: boolean;
  forceAdminMode?: boolean;
}

export const PlayerDirectoryDashboard: React.FC<PlayerDirectoryDashboardProps> = ({
  onAddToTeam,
  showTeamSelectors = false,
  forceAdminMode = false,
}) => {
  // DB States
  const [players, setPlayers] = useState<CricketPlayer[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const [sortField, setSortField] = useState("name");

  // Roster view configuration: slider vs grid view
  const [viewMode, setViewMode] = useState<"slider" | "grid">("slider");
  const sliderRef = useRef<HTMLDivElement>(null);

  // Admin View State
  const [isAdminMode, setIsAdminMode] = useState(forceAdminMode);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Auth contexts
  let isSuperAdmin = false;
  try {
    const authData = useAuth();
    isSuperAdmin = authData?.isSuperAdmin || false;
  } catch (e) {
    console.warn("AuthContext not ready", e);
  }

  // Selected player for performance statistics dashboard detail view modal
  const [selectedPlayerForView, setSelectedPlayerForView] = useState<CricketPlayer | null>(null);
  
  // Id of card whose quick action menu dropdown is open
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Selected player IDs for comparison radar/bar charts
  const [comparedPlayerIds, setComparedPlayerIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setIsAdminMode(false);
    } else if (forceAdminMode) {
      setIsAdminMode(true);
    }
  }, [isSuperAdmin, forceAdminMode]);

  // Load Players & Matches
  useEffect(() => {
    setIsLoading(true);

    const unsubPlayers = onSnapshot(collection(db, "cricket_players"), (snap) => {
      const pList: CricketPlayer[] = [];
      snap.forEach((docSnap) => {
        pList.push({ ...docSnap.data(), id: docSnap.id } as CricketPlayer);
      });
      setPlayers(pList);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching players:", err);
      setIsLoading(false);
    });

    const unsubMatches = onSnapshot(collection(db, "cricket_matches"), (snap) => {
      const mList: any[] = [];
      snap.forEach((docSnap) => {
        mList.push({ ...docSnap.data(), id: docSnap.id });
      });
      setMatches(mList);
    }, (err) => {
      console.error("Error fetching matches:", err);
    });

    return () => {
      unsubPlayers();
      unsubMatches();
    };
  }, []);

  // Compute stats on-the-fly for every player based on completed and live match history
  const combinedPlayerStats = useMemo(() => {
    const completedMatches = matches.filter((m) => m.status === "completed" || m.status === "live");

    return players.map((player) => {
      const pNameLower = player.fullName.toLowerCase().trim();
      let matchesPlayedCount = 0;
      let totalRunsSum = player.totalRuns || 0;
      let highestScoreVal = player.highestScore || 0;
      let wicketsTakenSum = player.wicketsTaken || 0;
      let totalBallsBowled = 0;
      let runsConcededSum = 0;
      let bestBowlingString = player.bestBowling || "0/0";
      let bestWicketsVal = 0;
      let bestRunsVal = 999;

      let catchesSum = 0;
      let stumpingsSum = 0;
      let runOutsSum = 0;

      // Extract best bowling numbers initial
      if (bestBowlingString && bestBowlingString.includes("/")) {
        const parts = bestBowlingString.split("/");
        bestWicketsVal = parseInt(parts[0]) || 0;
        bestRunsVal = parseInt(parts[1]) || 999;
      }

      // Check user appearance in completed match history
      completedMatches.forEach((match) => {
        let participated = false;

        // Innings 1 batsman check
        if (match.innings1?.batsmen) {
          match.innings1.batsmen.forEach((b: any) => {
            if (b.name && b.name.toLowerCase().trim() === pNameLower) {
              participated = true;
              totalRunsSum += b.runs || 0;
              if ((b.runs || 0) > highestScoreVal) {
                highestScoreVal = b.runs;
              }
            }
            // Fielding check
            if (b.isOut && b.fielderName && b.fielderName.toLowerCase().trim() === pNameLower) {
              const om = (b.outMode || '').toLowerCase();
              if (om.includes('caught')) catchesSum += 1;
              else if (om.includes('stumped')) stumpingsSum += 1;
              else if (om.includes('run out')) runOutsSum += 1;
            }
          });
        }

        // Innings 2 batsman check
        if (match.innings2?.batsmen) {
          match.innings2.batsmen.forEach((b: any) => {
            if (b.name && b.name.toLowerCase().trim() === pNameLower) {
              participated = true;
              totalRunsSum += b.runs || 0;
              if ((b.runs || 0) > highestScoreVal) {
                highestScoreVal = b.runs;
              }
            }
            // Fielding check
            if (b.isOut && b.fielderName && b.fielderName.toLowerCase().trim() === pNameLower) {
              const om = (b.outMode || '').toLowerCase();
              if (om.includes('caught')) catchesSum += 1;
              else if (om.includes('stumped')) stumpingsSum += 1;
              else if (om.includes('run out')) runOutsSum += 1;
            }
          });
        }

        // Innings 1 bowler check
        if (match.innings1?.bowlers) {
          match.innings1.bowlers.forEach((bw: any) => {
            if (bw.name && bw.name.toLowerCase().trim() === pNameLower) {
              participated = true;
              wicketsTakenSum += bw.wickets || 0;
              totalBallsBowled += bw.ballsBowled || 0;
              runsConcededSum += bw.runsConceded || 0;

              // Check best bowling
              if (bw.wickets > bestWicketsVal || (bw.wickets === bestWicketsVal && bw.runsConceded < bestRunsVal)) {
                bestWicketsVal = bw.wickets;
                bestRunsVal = bw.runsConceded;
                bestBowlingString = `${bw.wickets}/${bw.runsConceded}`;
              }
            }
          });
        }

        // Innings 2 bowler check
        if (match.innings2?.bowlers) {
          match.innings2.bowlers.forEach((bw: any) => {
            if (bw.name && bw.name.toLowerCase().trim() === pNameLower) {
              participated = true;
              wicketsTakenSum += bw.wickets || 0;
              totalBallsBowled += bw.ballsBowled || 0;
              runsConcededSum += bw.runsConceded || 0;

              // Check best bowling
              if (bw.wickets > bestWicketsVal || (bw.wickets === bestWicketsVal && bw.runsConceded < bestRunsVal)) {
                bestWicketsVal = bw.wickets;
                bestRunsVal = bw.runsConceded;
                bestBowlingString = `${bw.wickets}/${bw.runsConceded}`;
              }
            }
          });
        }

        // Team selection check (if user had name in roster)
        const teamAPlayers = Array.isArray(match.innings1?.batsmen) ? match.innings1.batsmen.map((x: any) => (x.name || "").toLowerCase().trim()) : [];
        const teamBPlayers = Array.isArray(match.innings2?.batsmen) ? match.innings2.batsmen.map((x: any) => (x.name || "").toLowerCase().trim()) : [];

        if (teamAPlayers.includes(pNameLower) || teamBPlayers.includes(pNameLower)) {
          participated = true;
        }

        if (participated) {
          matchesPlayedCount += 1;
        }
      });

      // Add dynamic additions
      const totalMatchesFinal = Math.max(player.matchesPlayed || 0, matchesPlayedCount);

      // Economy calculation
      let economyRateVal = player.economyRate || 0;
      if (totalBallsBowled > 0) {
        const overs = totalBallsBowled / 6;
        economyRateVal = parseFloat((runsConcededSum / overs).toFixed(2));
      }
      if (economyRateVal === 0 && runsConcededSum > 0) {
        economyRateVal = 6.0;
      }

      // Calculate performance rating (1.0 to 5.0 scale)
      // High score + total runs + wickets + economy factor
      let calcRating = 2.5; // Base average rating
      if (totalMatchesFinal > 0) {
        const runsAvg = totalRunsSum / totalMatchesFinal;
        const wicketsAvg = wicketsTakenSum / totalMatchesFinal;
        calcRating = 1.5 + (runsAvg * 0.05) + (wicketsAvg * 0.7) + ((catchesSum + stumpingsSum + runOutsSum) * 0.2);
        // Adjustment for bowling economy
        if (totalBallsBowled > 0) {
          if (economyRateVal <= 6.0) calcRating += 0.5;
          else if (economyRateVal > 10) calcRating -= 0.5;
        }
      }
      const performanceRating = parseFloat(Math.min(5.0, Math.max(1.0, calcRating)).toFixed(1));

      return {
        ...player,
        matchesPlayed: totalMatchesFinal,
        totalRuns: totalRunsSum,
        highestScore: highestScoreVal,
        wicketsTaken: wicketsTakenSum,
        economyRate: economyRateVal === 0 ? 5.5 : economyRateVal,
        bestBowling: bestWicketsVal > 0 ? bestBowlingString : (player.bestBowling || "0/0"),
        performanceRating,
        catches: catchesSum,
        stumpings: stumpingsSum,
        runOuts: runOutsSum,
        fieldingDismissals: catchesSum + stumpingsSum + runOutsSum,
      };
    });
  }, [players, matches]);

  // Helper to read player query parameters from HashRouter or standard URL
  const getPlayerIdFromUrl = () => {
    try {
      const hash = window.location.hash;
      const searchPart = hash.includes("?") ? hash.split("?")[1] : "";
      if (searchPart) {
        const params = new URLSearchParams(searchPart);
        return params.get("playerId") || params.get("player");
      }
      // Fallback to standard search parameters if any
      const stdParams = new URLSearchParams(window.location.search);
      return stdParams.get("playerId") || stdParams.get("player");
    } catch (e) {
      console.error("Error reading player query param:", e);
    }
    return null;
  };

  // Synchronise player URL parameters for direct deep-linked access to their dashboard
  useEffect(() => {
    const pId = getPlayerIdFromUrl();
    if (pId && combinedPlayerStats.length > 0) {
      const matchedPlayer = combinedPlayerStats.find(
        (p) =>
          p.id === pId || 
          p.fullName.toLowerCase().trim() === pId.toLowerCase().trim()
      );
      if (matchedPlayer) {
        setSelectedPlayerForView(matchedPlayer);
      }
    }
  }, [combinedPlayerStats]);

  // Synchronously auto-save player aggregated career statistics to Firestore Player Dashboard document
  useEffect(() => {
    if (players.length === 0 || matches.length === 0) return;
    if (isFirestoreQuotaExhausted()) return;

    combinedPlayerStats.forEach(async (computed) => {
      const original = players.find((p) => p.id === computed.id);
      if (!original) return;

      // Check if there is an actual difference in critical career metrics
      const hasDiff =
        original.matchesPlayed !== computed.matchesPlayed ||
        original.totalRuns !== computed.totalRuns ||
        original.highestScore !== computed.highestScore ||
        original.wicketsTaken !== computed.wicketsTaken ||
        original.economyRate !== computed.economyRate ||
        original.bestBowling !== computed.bestBowling ||
        original.performanceRating !== computed.performanceRating;

      if (hasDiff && computed.id) {
        try {
          const playerRef = doc(db, "cricket_players", computed.id);
          await updateDoc(playerRef, {
            matchesPlayed: computed.matchesPlayed,
            totalRuns: computed.totalRuns,
            highestScore: computed.highestScore,
            wicketsTaken: computed.wicketsTaken,
            economyRate: computed.economyRate,
            bestBowling: computed.bestBowling,
            performanceRating: computed.performanceRating,
            lastLoggedUpdate: Date.now()
          });
          console.log(`[Dashboard Auto-sync] Persistent career stats successfully updated & saved for ${computed.fullName}`);
        } catch (err) {
          if (isQuotaError(err)) {
            recordFirestoreQuotaExhaustion(60);
          } else {
            console.error(`[Dashboard Auto-sync] Failed to store telemetry for ${computed.fullName}:`, err);
          }
        }
      }
    });
  }, [combinedPlayerStats, players, matches]);

  // Filter selected player's match history dynamically
  const playerMatchHistory = useMemo(() => {
    if (!selectedPlayerForView) return [];
    const pNameLower = selectedPlayerForView.fullName.toLowerCase().trim();
    return matches.filter(m => m.status === "completed").map((m) => {
      let bat: any = null;
      let bowl: any = null;
      let played = false;

      m.innings1?.batsmen?.forEach((b: any) => {
        if (b.name && b.name.toLowerCase().trim() === pNameLower) {
          bat = { runs: b.runs || 0, balls: b.balls || 0, fours: b.fours || 0, sixes: b.sixes || 0, strikeRate: b.strikeRate || 0, isOut: b.isOut, dismissalText: b.dismissalText || "batting" };
          played = true;
        }
      });

      m.innings1?.bowlers?.forEach((bw: any) => {
        if (bw.name && bw.name.toLowerCase().trim() === pNameLower) {
          bowl = { wickets: bw.wickets || 0, runsConceded: bw.runsConceded || 0, overs: bw.overs || 0, ballsBowled: bw.ballsBowled || 0, economy: bw.economy || 0, maidens: bw.maidens || 0 };
          played = true;
        }
      });

      m.innings2?.batsmen?.forEach((b: any) => {
        if (b.name && b.name.toLowerCase().trim() === pNameLower) {
          bat = { runs: b.runs || 0, balls: b.balls || 0, fours: b.fours || 0, sixes: b.sixes || 0, strikeRate: b.strikeRate || 0, isOut: b.isOut, dismissalText: b.dismissalText || "batting" };
          played = true;
        }
      });

      m.innings2?.bowlers?.forEach((bw: any) => {
        if (bw.name && bw.name.toLowerCase().trim() === pNameLower) {
          bowl = { wickets: bw.wickets || 0, runsConceded: bw.runsConceded || 0, overs: bw.overs || 0, ballsBowled: bw.ballsBowled || 0, economy: bw.economy || 0, maidens: bw.maidens || 0 };
          played = true;
        }
      });

      if (!played) {
        // Fallback team squad check
        const squadA = Array.isArray(m.teamASquad) ? m.teamASquad.map((x: any) => String(x).toLowerCase().trim()) : [];
        const squadB = Array.isArray(m.teamBSquad) ? m.teamBSquad.map((x: any) => String(x).toLowerCase().trim()) : [];
        if (squadA.includes(pNameLower) || squadB.includes(pNameLower)) {
          played = true;
        }
      }

      if (played) {
        return {
          id: m.id,
          matchName: `${m.teamA} vs ${m.teamB}`,
          date: m.matchDate || "Recent game",
          status: m.status,
          batting: bat,
          bowling: bowl
        };
      }
      return null;
    }).filter(Boolean);
  }, [selectedPlayerForView, matches]);

  // Performance progression and metrics
  const modalStats = useMemo(() => {
    if (!selectedPlayerForView) return null;
    const history = playerMatchHistory;
    
    let cumulativeRuns = 0;
    let cumulativeWickets = 0;
    let totalBallsFaced = 0;
    let dismissalsCount = 0;
    let totalRunsConceded = 0;
    let totalBallsBowled = 0;

    const chartPoints = history.map((h: any, i: number) => {
      if (h.batting) {
        cumulativeRuns += h.batting.runs || 0;
        totalBallsFaced += h.batting.balls || 0;
        if (h.batting.isOut) dismissalsCount += 1;
      }
      if (h.bowling) {
        cumulativeWickets += h.bowling.wickets || 0;
        totalRunsConceded += h.bowling.runsConceded || 0;
        totalBallsBowled += h.bowling.ballsBowled || 0;
      }
      return {
        name: `M${i + 1}`,
        matchName: h.matchName,
        runs: h.batting?.runs || 0,
        wickets: h.bowling?.wickets || 0
      };
    });

    const battingStrikeRate = totalBallsFaced > 0 ? parseFloat(((cumulativeRuns / totalBallsFaced) * 100).toFixed(1)) : 0;
    const battingAvg = dismissalsCount > 0 ? parseFloat((cumulativeRuns / dismissalsCount).toFixed(1)) : cumulativeRuns;
    const economyRate = totalBallsBowled > 0 ? parseFloat(((totalRunsConceded / (totalBallsBowled / 6))).toFixed(2)) : (selectedPlayerForView.economyRate || 5.5);

    return {
      battingStrikeRate,
      battingAvg,
      economyRate,
      totalBallsFaced,
      dismissalsCount,
      chartPoints
    };
  }, [selectedPlayerForView, playerMatchHistory]);

  // Admin approval/rejection handlers
  const handleApprove = async (playerId: string, name: string) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, isVerified: true, approvalStatus: "approved" } : p));
    if (isFirestoreQuotaExhausted()) {
      triggerToast(`Approved registration for ${name}! (Local)`);
      return;
    }
    try {
      const playerRef = doc(db, "cricket_players", playerId);
      await updateDoc(playerRef, {
        isVerified: true,
        approvalStatus: "approved"
      });
      triggerToast(`Approved registration for ${name}!`);
    } catch (err) {
      if (isQuotaError(err)) {
        recordFirestoreQuotaExhaustion(60);
        triggerToast(`Approved registration for ${name}! (Local)`);
      } else {
        console.error(err);
        triggerToast("Failed to sync approval to cloud.");
      }
    }
  };

  const handleReject = async (playerId: string, name: string) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, isVerified: false, approvalStatus: "rejected" } : p));
    if (isFirestoreQuotaExhausted()) {
      triggerToast(`Rejected registration for ${name} (Local)`);
      return;
    }
    try {
      const playerRef = doc(db, "cricket_players", playerId);
      await updateDoc(playerRef, {
        isVerified: false,
        approvalStatus: "rejected"
      });
      triggerToast(`Rejected registration for ${name}`);
    } catch (err) {
      if (isQuotaError(err)) {
        recordFirestoreQuotaExhaustion(60);
        triggerToast(`Rejected registration for ${name} (Local)`);
      } else {
        console.error(err);
        triggerToast("Failed to sync rejection to cloud.");
      }
    }
  };

  const handleDelete = async (playerId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete player ${name}?`)) return;
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    if (isFirestoreQuotaExhausted()) {
      triggerToast(`Deleted player profile: ${name}`);
      return;
    }
    try {
      await deleteDoc(doc(db, "cricket_players", playerId));
      triggerToast(`Deleted player profile: ${name}`);
    } catch (err) {
      if (isQuotaError(err)) {
        recordFirestoreQuotaExhaustion(60);
        triggerToast(`Deleted player profile: ${name}`);
      } else {
        console.error(err);
        triggerToast("Failed to delete record from cloud.");
      }
    }
  };

  // Toast notifier
  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast(null);
    }, 4000);
  };

  // Filter & Sort Logic
  const processedPlayers = useMemo(() => {
    let list = combinedPlayerStats;

    // Filter by approval:
    // If not admin mode, we ONLY show approved ones.
    // If admin mode, we show all (pending / approved / rejected).
    if (!isAdminMode) {
      list = list.filter((p) => p.isVerified === true || p.approvalStatus === "approved");
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.fullName.toLowerCase().includes(query) ||
          p.role.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          (p.bowlingStyle && p.bowlingStyle.toLowerCase().includes(query))
      );
    }

    // Filter by Playing Role
    if (roleFilter !== "All") {
      list = list.filter((p) => p.role === roleFilter);
    }

    // Filter by Performance Rating
    if (ratingFilter !== "All") {
      if (ratingFilter === "5") {
        list = list.filter((p) => p.performanceRating >= 4.5);
      } else if (ratingFilter === "4") {
        list = list.filter((p) => p.performanceRating >= 3.8 && p.performanceRating < 4.5);
      } else if (ratingFilter === "3") {
        list = list.filter((p) => p.performanceRating >= 2.8 && p.performanceRating < 3.8);
      } else if (ratingFilter === "1-2") {
        list = list.filter((p) => p.performanceRating < 2.8);
      }
    }

    // Filter by Auction Price Range (in ₹ INR)
    if (priceFilter !== "All") {
      if (priceFilter === "low") {
        list = list.filter((p) => (p.peakAuctionPrice || 0) < 500000);
      } else if (priceFilter === "mid") {
        list = list.filter((p) => (p.peakAuctionPrice || 0) >= 500000 && (p.peakAuctionPrice || 0) <= 1500000);
      } else if (priceFilter === "high") {
        list = list.filter((p) => (p.peakAuctionPrice || 0) > 1500000);
      }
    }

    // Sort players
    list.sort((a, b) => {
      if (sortField === "name") {
        return a.fullName.localeCompare(b.fullName);
      } else if (sortField === "runs") {
        return b.totalRuns - a.totalRuns;
      } else if (sortField === "wickets") {
        return b.wicketsTaken - a.wicketsTaken;
      } else if (sortField === "price") {
        return (b.peakAuctionPrice || 0) - (a.peakAuctionPrice || 0);
      } else if (sortField === "rating") {
        return b.performanceRating - a.performanceRating;
      }
      return 0;
    });

    return list;
  }, [combinedPlayerStats, isAdminMode, searchQuery, roleFilter, ratingFilter, priceFilter, sortField]);

  // Helper to calculate exact dynamic strike rate vs average metrics for compared players
  const getPerformanceMetrics = (p: CricketPlayer) => {
    const pNameLower = p.fullName.toLowerCase().trim();
    let cumulativeRuns = 0;
    let totalBallsFaced = 0;
    let dismissalsCount = 0;
    let cumulativeWickets = 0;
    let totalBallsBowled = 0;
    let totalRunsConceded = 0;

    matches.filter(m => m.status === "completed" || m.status === "live").forEach((m) => {
      m.innings1?.batsmen?.forEach((b: any) => {
        if (b.name && b.name.toLowerCase().trim() === pNameLower) {
          cumulativeRuns += b.runs || 0;
          totalBallsFaced += b.balls || 0;
          if (b.isOut) dismissalsCount += 1;
        }
      });
      m.innings1?.bowlers?.forEach((bw: any) => {
        if (bw.name && bw.name.toLowerCase().trim() === pNameLower) {
          cumulativeWickets += bw.wickets || 0;
          totalBallsBowled += bw.ballsBowled || 0;
          totalRunsConceded += bw.runsConceded || 0;
        }
      });
      m.innings2?.batsmen?.forEach((b: any) => {
        if (b.name && b.name.toLowerCase().trim() === pNameLower) {
          cumulativeRuns += b.runs || 0;
          totalBallsFaced += b.balls || 0;
          if (b.isOut) dismissalsCount += 1;
        }
      });
      m.innings2?.bowlers?.forEach((bw: any) => {
        if (bw.name && bw.name.toLowerCase().trim() === pNameLower) {
          cumulativeWickets += bw.wickets || 0;
          totalBallsBowled += bw.ballsBowled || 0;
          totalRunsConceded += bw.runsConceded || 0;
        }
      });
    });

    const battingStrikeRate = totalBallsFaced > 0 
      ? parseFloat(((cumulativeRuns / totalBallsFaced) * 100).toFixed(1)) 
      : (p.role === "Batter" || p.role === "All-Rounder" ? 128.5 : 85.0);
    
    const battingAvg = dismissalsCount > 0 
      ? parseFloat((cumulativeRuns / dismissalsCount).toFixed(1)) 
      : (cumulativeRuns > 0 ? cumulativeRuns : (p.role === "Batter" ? 32.0 : p.role === "All-Rounder" ? 22.5 : 10.0));

    return {
      name: p.fullName,
      strikeRate: battingStrikeRate,
      average: battingAvg,
      runs: cumulativeRuns || p.totalRuns || 0,
      wickets: cumulativeWickets || p.wicketsTaken || 0,
    };
  };

  // CSV Exporter Action triggered by action bar button
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Full Name",
      "Playing Role",
      "Batting Style",
      "Bowling Style",
      "DOB",
      "Gender",
      "Email",
      "Mobile Contact",
      "Matches Played",
      "Total Runs",
      "Highest Score",
      "Wickets Taken",
      "Avg Economy",
      "Best Bowling Fig",
      "Peak Auction (INR ₹)",
      "Performance Rating",
      "Approval State"
    ];

    const rows = processedPlayers.map((p) => [
      p.id || "",
      p.fullName,
      p.role,
      p.battingStyle,
      p.bowlingStyle || "None",
      p.dob || "",
      p.gender || "Male",
      p.email,
      p.mobile,
      p.matchesPlayed || 0,
      p.totalRuns || 0,
      p.highestScore || 0,
      p.wicketsTaken || 0,
      p.economyRate || 5.5,
      p.bestBowling || "0/0",
      p.peakAuctionPrice || 0,
      p.performanceRating || 2.5,
      p.isVerified ? "Approved" : p.approvalStatus || "Pending"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `League_Scouting_Roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("CSV File Exported successfully!");
  };

  return (
    <div className="w-full bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-900 shadow-xl p-6 md:p-8 space-y-6 mt-12 overflow-hidden">
      {/* Toast Warning Popup */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 right-6 z-[200] bg-slate-950 text-white border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-2xl max-w-sm"
          >
            <Sparkles className="text-emerald-400 shrink-0" size={18} />
            <span className="text-xs font-semibold leading-relaxed">{showToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Block Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 dark:border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Trophy size={20} className="text-emerald-500" />
            </span>
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Verified League Roster
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-xl">
            Check the league player pool. Aggregate player stats are updated automatically from completed match records in real time!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* View Mode Toggle Switch */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
            <button
              onClick={() => setViewMode("slider")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "slider"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-450 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
              title="Slider view"
            >
              <SlidersHorizontal size={12} /> Slider
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-450 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
              title="Grid view"
            >
              <LayoutGrid size={12} /> Grid
            </button>
          </div>

          {/* Dashboard Admin View Controller Toggle switch - Super Admin Dashboard Only */}
          {isSuperAdmin && forceAdminMode && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Admin cockpit Mode
              </span>
              <button
                onClick={() => setIsAdminMode(!isAdminMode)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all border-none flex items-center gap-1.5 ${
                  isAdminMode
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                }`}
              >
                {isAdminMode ? (
                  <>
                    <ShieldCheck size={14} /> Admin Active
                  </>
                ) : (
                  "Toggle Admin"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selector Action bar filter container */}
      <div
        id="player-directory-action-bar"
        className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-55/40 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-100 dark:border-slate-900"
      >
        {/* Search */}
        <div className="md:col-span-3 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roster players..."
            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Role filter */}
        <div className="md:col-span-2 space-y-1">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full py-2.5 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-755 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Roles</option>
            <option value="Batter">Batter</option>
            <option value="Bowler">Bowler</option>
            <option value="All-Rounder">All-Rounder</option>
            <option value="Wicket-keeper">Wicket-keeper</option>
          </select>
        </div>

        {/* Rating filter */}
        <div className="md:col-span-2 space-y-1">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full py-2.5 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-755 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Ratings</option>
            <option value="5">Class (4.5+ ★)</option>
            <option value="4">Pro (3.8 - 4.4 ★)</option>
            <option value="3">Amateur (2.8 - 3.7 ★)</option>
            <option value="1-2">Rookie (&lt; 2.8 ★)</option>
          </select>
        </div>

        {/* Price limit filter */}
        <div className="md:col-span-2 space-y-1">
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="w-full py-2.5 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-755 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Appraisals</option>
            <option value="low">Under ₹5 Lakhs</option>
            <option value="mid">₹5L - ₹15L</option>
            <option value="high">₹15L + (Premium)</option>
          </select>
        </div>

        {/* Sort */}
        <div className="md:col-span-2 space-y-1">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="w-full py-2.5 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-755 dark:text-slate-200 focus:outline-none"
          >
            <option value="name">Sort: A-Z</option>
            <option value="runs">Sort: Highest Runs</option>
            <option value="wickets">Sort: Wickets</option>
            <option value="price">Sort: Appraisal Bid</option>
            <option value="rating">Sort: Talent Star</option>
          </select>
        </div>

        {/* CSV export action button */}
        <div className="md:col-span-1">
          <button
            onClick={handleExportCSV}
            title="Download CSV roster sheet"
            className="w-full py-2.5 bg-slate-900 border-none hover:bg-slate-800 text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs transition"
          >
            <FileDown size={14} />
          </button>
        </div>
      </div>

      {/* Player Comparison Analytics Panel */}
      {comparedPlayerIds.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-250 dark:border-slate-800 pb-4">
            <div>
              <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-amber-500" /> Player Performance Comparison
              </h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                Comparing Strike Rate vs Average side-by-side using dynamic live match calculations.
              </p>
            </div>
            <button
              onClick={() => setComparedPlayerIds([])}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border-none rounded-xl text-[9px] font-black uppercase cursor-pointer transition-all shrink-0"
            >
              Clear Comparison
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {comparedPlayerIds.map(pId => {
              const p = players.find(x => x.id === pId);
              if (!p) return null;
              return (
                <div key={pId} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 p-2 rounded-xl text-xs font-semibold pr-3 shadow-sm select-none">
                  <div className="w-6 h-6 rounded-lg overflow-hidden bg-slate-150 flex items-center justify-center shrink-0">
                    {p.photo ? (
                      <img src={p.photo} alt={p.fullName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <User size={12} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold truncate max-w-[120px] text-[11px] text-slate-800 dark:text-white">{p.fullName}</p>
                    <p className="text-[8px] text-slate-400 uppercase tracking-widest">{p.role}</p>
                  </div>
                  <button
                    onClick={() => setComparedPlayerIds(prev => prev.filter(id => id !== pId))}
                    className="p-0.5 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 rounded-full border-none bg-transparent cursor-pointer ml-1"
                    title="Remove from comparison"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Recharts BarChart comparing strike rate vs average */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparedPlayerIds.map(pId => {
                  const p = players.find(x => x.id === pId);
                  if (!p) return null;
                  return getPerformanceMetrics(p);
                }).filter(Boolean)}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '1rem',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Bar 
                  dataKey="strikeRate" 
                  name="Strike Rate (%)" 
                  fill="#f59e0b" 
                  radius={[6, 6, 0, 0]}
                />
                <Bar 
                  dataKey="average" 
                  name="Batting Avg" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Grid of registered approved cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Loading active player cards...
          </span>
        </div>
      ) : processedPlayers.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem]">
          <Users size={36} className="mx-auto text-slate-300 mb-3" />
          <h4 className="text-sm font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
            No registered database players
          </h4>
          <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto mt-1 leading-relaxed">
            {isAdminMode
              ? "Change filters or search querying database to see pending registrations."
              : "No approved players in the league pool yet. Use Admin cockpit mode to review registrations!"}
          </p>
        </div>
      ) : viewMode === "slider" ? (
        <div className="relative group/slider-panel">
          {/* Scroll controllers and indicator at slider header space */}
          <div className="absolute -top-[52px] right-2 flex items-center gap-2">
            <button
              onClick={() => {
                if (sliderRef.current) {
                  sliderRef.current.scrollBy({ left: -360, behavior: "smooth" });
                }
              }}
              className="p-1.5 md:p-2 border border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl transition duration-150 cursor-pointer"
              title="Previous players"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => {
                if (sliderRef.current) {
                  sliderRef.current.scrollBy({ left: 360, behavior: "smooth" });
                }
              }}
              className="p-1.5 md:p-2 border border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl transition duration-150 cursor-pointer"
              title="Next players"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Horizontal scroll container */}
          <div
            ref={sliderRef}
            className="flex gap-6 overflow-x-auto pb-6 scroll-smooth snap-x snap-mandatory custom-scrollbar"
            style={{ scrollbarWidth: 'thin' }}
          >
            <AnimatePresence mode="popLayout">
              {processedPlayers.map((player) => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", damping: 25 }}
                  className={`snap-start shrink-0 w-[290px] sm:w-[320px] md:w-[350px] bg-white dark:bg-slate-900 border rounded-[2.5rem] p-5 pt-12 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all group hover:shadow-md ${
                    player.isVerified
                      ? "border-slate-200 dark:border-slate-800/60"
                      : player.approvalStatus === "rejected"
                      ? "border-rose-100 bg-rose-50/50 dark:bg-rose-950/5 dark:border-rose-900"
                      : "border-amber-100 bg-amber-50/50 dark:bg-amber-950/5 dark:border-amber-900"
                  }`}
                >
                  {/* Approve/Reject Status Badge (Accessible to view status) */}
                  <div className="absolute left-5 top-4">
                    {player.isVerified || player.approvalStatus === "approved" ? (
                      <span className="px-2 py-0.5 text-[8px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-md font-extrabold tracking-wider uppercase border border-emerald-200/50 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Approved
                      </span>
                    ) : player.approvalStatus === "rejected" ? (
                      <span className="px-2 py-0.5 text-[8px] bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-450 rounded-md font-extrabold tracking-wider uppercase border border-rose-200/50 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Rejected
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[8px] bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 rounded-md font-extrabold tracking-wider uppercase border border-amber-200/50 flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Pending Approval
                      </span>
                    )}
                  </div>

                  {/* Quick Action menu trigger and overlay - Only accessible to Super Admin inside Dashboard */}
                  {isSuperAdmin && isAdminMode && (
                    <div className="absolute top-3 right-4 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === player.id ? null : player.id!);
                        }}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 transition-colors"
                        title="Admin Controls"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      <AnimatePresence>
                        {activeMenuId === player.id && (
                          <>
                            {/* Dismissal overlay backdrop */}
                            <div 
                              className="fixed inset-0 z-20" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                              }}
                            />
                            
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 py-1.5 overflow-hidden"
                            >
                              <div className="px-3 py-1 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-900 mb-1">
                                Admin Controls
                              </div>
                              
                              {(!player.isVerified || player.approvalStatus !== "approved") && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(player.id!, player.fullName);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center gap-1.5"
                                >
                                  <CheckCircle2 size={12} /> Approve Player
                                </button>
                              )}
                              
                              {(player.isVerified || player.approvalStatus !== "rejected") && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReject(player.id!, player.fullName);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 flex items-center gap-1.5"
                                >
                                  <ShieldX size={12} /> Disapprove Player
                                </button>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(player.id!, player.fullName);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-900 pt-1.5"
                              >
                                <Trash2 size={12} /> Delete Profile
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Header elements inside card */}
                  <div className="flex gap-4 cursor-pointer" onClick={() => setSelectedPlayerForView(player)}>
                    {/* Photo with fallback */}
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-950 overflow-hidden shrink-0 border border-slate-200/50 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      {player.photo ? (
                        <img
                          src={player.photo}
                          alt={player.fullName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={24} className="text-slate-400" />
                      )}
                    </div>

                    {/* Profile info details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-heading font-black text-xs md:text-sm text-slate-900 dark:text-white truncate">
                          {player.fullName}
                        </h4>
                        {player.isVerified && (
                          <span className="text-emerald-500 shrink-0" title="League Verified Player">
                            <ShieldCheck size={14} className="fill-emerald-500 text-white dark:text-slate-900" />
                          </span>
                        )}
                      </div>

                      {/* Meta info tags */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 text-[8px] bg-slate-105 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold rounded-lg uppercase tracking-wider">
                          {player.role}
                        </span>
                        <span className="px-2 py-0.5 text-[8px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 font-black rounded-lg uppercase tracking-wider flex items-center gap-1">
                          <Star size={8} className="fill-emerald-500 text-emerald-500" />
                          {player.performanceRating}
                        </span>
                      </div>

                      {/* Email/Phone */}
                      <div className="text-[9px] text-slate-400 font-semibold space-y-0.5 pt-1">
                        <p className="truncate">{player.email}</p>
                        <p>+91 {player.mobile}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sub section: Historic Performance & League Appraisals */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-55/30 dark:bg-slate-950/40 p-3 rounded-2xl flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center text-[10px] pb-1.5 border-b border-white/50 dark:border-slate-850">
                        <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          League Appraisal Price
                        </span>
                        <span className="font-mono text-[11px] font-black text-emerald-600 dark:text-emerald-450">
                          ₹{(player.peakAuctionPrice || 0).toLocaleString("en-IN")}
                        </span>
                      </div>

                      {/* Matrix items */}
                      <div className="grid grid-cols-4 text-center gap-2 mt-2">
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-slate-400 dark:text-slate-500 block font-bold uppercase">Matches</span>
                          <strong className="text-slate-800 dark:text-slate-100 text-xs font-black">
                            {player.matchesPlayed || 0}
                          </strong>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-slate-400 dark:text-slate-500 block font-bold uppercase">Runs</span>
                          <strong className="text-slate-800 dark:text-slate-100 text-xs font-black">
                            {player.totalRuns || 0}
                          </strong>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-slate-400 dark:text-slate-500 block font-bold uppercase">Wickets</span>
                          <strong className="text-slate-800 dark:text-slate-100 text-xs font-black">
                            {player.wicketsTaken || 0}
                          </strong>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-slate-400 dark:text-slate-500 block font-bold uppercase">Econ</span>
                          <strong className="text-slate-800 dark:text-slate-100 text-xs font-black">
                            {player.economyRate || 5.5}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Best bowling figure and batting specifics */}
                    <div className="flex justify-between items-center pt-2 mt-2 text-[8px] font-bold text-slate-450 border-t border-slate-100 dark:border-slate-850">
                      <span>Best: {player.bestBowling || "0/0"}</span>
                      <span>Style: {player.battingStyle}</span>
                    </div>
                  </div>

                  {/* Team addition hooks if active (useful for match scoring team drafts) */}
                  {showTeamSelectors && onAddToTeam && (player.isVerified || player.approvalStatus === "approved") && (
                    <div className="mt-4 grid grid-cols-2 gap-2 pt-2 border-t border-slate-150 dark:border-slate-800">
                      <button
                        onClick={() => onAddToTeam(player, "A")}
                        className="py-1.5 px-3 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer border-none hover:bg-emerald-600 transition"
                      >
                        + Team A
                      </button>
                      <button
                        onClick={() => onAddToTeam(player, "B")}
                        className="py-1.5 px-3 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer border-none hover:bg-emerald-700 transition"
                      >
                        + Team B
                      </button>
                    </div>
                  )}

                  {/* Admin Quick Action approvals bar - Only shown inside Super Admin Dashboard */}
                  {isSuperAdmin && isAdminMode && (
                    <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {(!player.isVerified || player.approvalStatus !== "approved") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(player.id!, player.fullName);
                          }}
                          className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-650 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border-none flex items-center justify-center gap-1 transition-colors"
                        >
                          <CheckCircle2 size={10} /> Approve
                        </button>
                      )}
                      {(player.isVerified || player.approvalStatus !== "rejected") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(player.id!, player.fullName);
                          }}
                          className="py-1.5 px-3 bg-rose-500 hover:bg-rose-650 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border-none flex items-center justify-center gap-1 transition-colors"
                        >
                          <ShieldX size={10} /> Reject
                        </button>
                      )}
                    </div>
                  )}

                  {/* Performance stats modal trigger button */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedPlayerForView(player)}
                      className="py-2 px-3 bg-slate-50 hover:bg-emerald-500 hover:text-white dark:bg-slate-850 dark:hover:bg-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-650 dark:text-slate-305 transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer border-none"
                    >
                      <TrendingUp size={12} /> Career Stats
                    </button>
                    <button
                      onClick={() => {
                        const isSelected = comparedPlayerIds.includes(player.id || '');
                        if (isSelected) {
                          setComparedPlayerIds(prev => prev.filter(id => id !== player.id));
                        } else {
                          if (comparedPlayerIds.length >= 6) {
                            triggerToast("You can compare up to 6 players at once!");
                            return;
                          }
                          setComparedPlayerIds(prev => [...prev, player.id || '']);
                          triggerToast(`Added ${player.fullName} to comparison list.`);
                        }
                      }}
                      className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer border-none ${
                        comparedPlayerIds.includes(player.id || '')
                          ? "bg-amber-500 text-slate-950 hover:bg-amber-600"
                          : "bg-slate-50 hover:bg-amber-500 hover:text-slate-950 dark:bg-slate-850 dark:hover:bg-amber-600 dark:text-slate-305"
                      }`}
                    >
                      <Check size={12} /> {comparedPlayerIds.includes(player.id || '') ? 'Comparing' : 'Compare'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div id="registered-players-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {processedPlayers.map((player) => (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25 }}
                className={`bg-white dark:bg-slate-900 border rounded-[2.5rem] p-5 pt-12 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all group hover:shadow-md ${
                  player.isVerified
                    ? "border-slate-200 dark:border-slate-800/60"
                    : player.approvalStatus === "rejected"
                    ? "border-rose-100 bg-rose-50/50 dark:bg-rose-950/5 dark:border-rose-900"
                    : "border-amber-100 bg-amber-50/50 dark:bg-amber-950/5 dark:border-amber-900"
                }`}
              >
                {/* Approve/Reject Status Badge (Accessible to view status) */}
                <div className="absolute left-5 top-4">
                  {player.isVerified || player.approvalStatus === "approved" ? (
                    <span className="px-2 py-0.5 text-[8px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-md font-extrabold tracking-wider uppercase border border-emerald-200/50 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Approved
                    </span>
                  ) : player.approvalStatus === "rejected" ? (
                    <span className="px-2 py-0.5 text-[8px] bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 rounded-md font-extrabold tracking-wider uppercase border border-rose-200/50 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Rejected
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[8px] bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 rounded-md font-extrabold tracking-wider uppercase border border-amber-200/50 flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Pending Approval
                    </span>
                  )}
                </div>

                {/* Quick Action menu trigger and overlay - Only accessible to Super Admin inside Dashboard */}
                {isSuperAdmin && isAdminMode && (
                  <div className="absolute top-3 right-4 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === player.id ? null : player.id!);
                      }}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 transition-colors"
                      title="Admin Controls"
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    <AnimatePresence>
                      {activeMenuId === player.id && (
                        <>
                          {/* Dismissal overlay backdrop */}
                          <div 
                            className="fixed inset-0 z-20" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                            }}
                          />
                          
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 py-1.5 overflow-hidden"
                          >
                            <div className="px-3 py-1 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-900 mb-1">
                              Admin Controls
                            </div>
                            
                            {(!player.isVerified || player.approvalStatus !== "approved") && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(player.id!, player.fullName);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center gap-1.5"
                              >
                                <CheckCircle2 size={12} /> Approve Player
                              </button>
                            )}
                            
                            {(player.isVerified || player.approvalStatus !== "rejected") && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(player.id!, player.fullName);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-450 hover:bg-amber-50 dark:hover:bg-amber-950/20 flex items-center gap-1.5"
                              >
                                <ShieldX size={12} /> Disapprove Player
                              </button>
                            )}
                            
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(player.id!, player.fullName);
                                  setActiveMenuId(null);
                                }}
                              className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-900 pt-1.5"
                            >
                              <Trash2 size={12} /> Delete Profile
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Header elements inside card */}
                <div className="flex gap-4 cursor-pointer" onClick={() => setSelectedPlayerForView(player)}>
                  {/* Photo with fallback */}
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-950 overflow-hidden shrink-0 border border-slate-200/50 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    {player.photo ? (
                      <img
                        src={player.photo}
                        alt={player.fullName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={24} className="text-slate-400" />
                    )}
                  </div>

                  {/* Profile info details */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-heading font-black text-xs md:text-sm text-slate-900 dark:text-white truncate">
                        {player.fullName}
                      </h4>
                      {player.isVerified && (
                        <span className="text-emerald-500 shrink-0" title="League Verified Player">
                          <ShieldCheck size={14} className="fill-emerald-500 text-white dark:text-slate-900" />
                        </span>
                      )}
                    </div>

                    {/* Meta info tags */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 text-[8px] bg-slate-105 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold rounded-lg uppercase tracking-wider">
                        {player.role}
                      </span>
                      <span className="px-2 py-0.5 text-[8px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 font-black rounded-lg uppercase tracking-wider flex items-center gap-1">
                        <Star size={8} className="fill-emerald-500 text-emerald-500" />
                        {player.performanceRating}
                      </span>
                    </div>

                    {/* Email/Phone */}
                    <div className="text-[9px] text-slate-400 font-semibold space-y-0.5 pt-1">
                      <p className="truncate">{player.email}</p>
                      <p>+91 {player.mobile}</p>
                    </div>
                  </div>
                </div>

                {/* Sub section: Historic Performance & League Appraisals */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-55/30 dark:bg-slate-950/40 p-3 rounded-2xl">
                  <div className="flex justify-between items-center text-[10px] pb-1.5 border-b border-white/50 dark:border-slate-850">
                    <span className="font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">
                      League Appraisal Price
                    </span>
                    <span className="font-mono text-[11px] font-black text-emerald-600 dark:text-emerald-450">
                      ₹{(player.peakAuctionPrice || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Matrix items */}
                  <div className="grid grid-cols-4 text-center gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-404 dark:text-slate-500 block">Matches</span>
                      <strong className="text-slate-800 dark:text-slate-100 text-xs font-black">
                        {player.matchesPlayed || 0}
                      </strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-404 dark:text-slate-500 block">Runs</span>
                      <strong className="text-slate-800 dark:text-slate-100 text-xs font-black">
                        {player.totalRuns || 0}
                      </strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-404 dark:text-slate-500 block">Wickets</span>
                      <strong className="text-slate-800 dark:text-slate-100 text-xs font-black">
                        {player.wicketsTaken || 0}
                      </strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-404 dark:text-slate-500 block">Econ</span>
                      <strong className="text-slate-800 dark:text-slate-100 text-xs font-black">
                        {player.economyRate || 5.5}
                      </strong>
                    </div>
                  </div>

                  {/* Best bowling figure and batting specifics */}
                  <div className="flex justify-between items-center pt-2 text-[8px] font-bold text-slate-450 border-t border-slate-100 dark:border-slate-850">
                    <span>Best: {player.bestBowling || "0/0"}</span>
                    <span>Style: {player.battingStyle}</span>
                  </div>
                </div>

                {/* Team addition hooks if active (useful for match scoring team drafts) */}
                {showTeamSelectors && onAddToTeam && (player.isVerified || player.approvalStatus === "approved") && (
                  <div className="mt-4 grid grid-cols-2 gap-2 pt-2 border-t border-slate-150 dark:border-slate-800">
                    <button
                      onClick={() => onAddToTeam(player, "A")}
                      className="py-1.5 px-3 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer border-none hover:bg-emerald-600 transition"
                    >
                      + Team A
                    </button>
                    <button
                      onClick={() => onAddToTeam(player, "B")}
                      className="py-1.5 px-3 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer border-none hover:bg-emerald-700 transition"
                    >
                      + Team B
                    </button>
                  </div>
                )}

                {/* Admin Quick Action approvals bar - Only shown inside Super Admin Dashboard */}
                {isSuperAdmin && isAdminMode && (
                  <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {(!player.isVerified || player.approvalStatus !== "approved") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(player.id!, player.fullName);
                        }}
                        className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-655 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border-none flex items-center justify-center gap-1 transition-colors"
                      >
                        <CheckCircle2 size={10} /> Approve
                      </button>
                    )}
                    {(player.isVerified || player.approvalStatus !== "rejected") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(player.id!, player.fullName);
                        }}
                        className="py-1.5 px-3 bg-rose-500 hover:bg-rose-655 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border-none flex items-center justify-center gap-1 transition-colors"
                      >
                        <ShieldX size={10} /> Reject
                      </button>
                    )}
                  </div>
                )}

                {/* Performance stats modal trigger button */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedPlayerForView(player)}
                    className="py-2 px-3 bg-slate-50 hover:bg-emerald-500 hover:text-white dark:bg-slate-850 dark:hover:bg-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-655 dark:text-slate-305 transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer border-none"
                  >
                    <TrendingUp size={12} /> Career Stats
                  </button>
                  <button
                    onClick={() => {
                      const isSelected = comparedPlayerIds.includes(player.id || '');
                      if (isSelected) {
                        setComparedPlayerIds(prev => prev.filter(id => id !== player.id));
                      } else {
                        if (comparedPlayerIds.length >= 6) {
                          triggerToast("You can compare up to 6 players at once!");
                          return;
                        }
                        setComparedPlayerIds(prev => [...prev, player.id || '']);
                        triggerToast(`Added ${player.fullName} to comparison list.`);
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer border-none ${
                      comparedPlayerIds.includes(player.id || '')
                        ? "bg-amber-500 text-slate-950 hover:bg-amber-600"
                        : "bg-slate-50 hover:bg-amber-500 hover:text-slate-950 dark:bg-slate-850 dark:hover:bg-amber-600 dark:text-slate-305"
                    }`}
                  >
                    <Check size={12} /> {comparedPlayerIds.includes(player.id || '') ? 'Comparing' : 'Compare'}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Career Performance Detailed Modal */}
      <AnimatePresence>
        {selectedPlayerForView && modalStats && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              {/* Abs Close Button */}
              <button
                onClick={() => setSelectedPlayerForView(null)}
                className="absolute right-6 top-6 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-350 rounded-full border-none cursor-pointer transition z-10"
                title="Dismiss details"
              >
                <X size={16} />
              </button>

              {/* Header Container */}
              <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/25">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  {/* Photo Profile */}
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-slate-100 dark:bg-slate-950 overflow-hidden shrink-0 border-2 border-emerald-500/20 flex items-center justify-center">
                     {selectedPlayerForView.photo ? (
                      <img
                        src={selectedPlayerForView.photo}
                        alt={selectedPlayerForView.fullName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={32} className="text-slate-400" />
                    )}
                  </div>

                  {/* Badges and metadata */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">
                        {selectedPlayerForView.fullName}
                      </h3>
                      {selectedPlayerForView.isVerified && (
                        <span className="p-1 bg-emerald-500/10 text-emerald-500 rounded-lg" title="League Verified Profile">
                          <CheckCircle2 size={16} className="fill-emerald-500 text-white dark:text-slate-900" />
                        </span>
                      )}

                      {/* Direct shareable copy dashboard link */}
                      <button
                        onClick={async () => {
                          const routePrefix = window.location.origin + window.location.pathname;
                          const directUrl = `${routePrefix}#/live/cricket-details?playerId=${selectedPlayerForView.id}`;
                          try {
                            await navigator.clipboard.writeText(directUrl);
                            triggerToast("Direct dashboard URL copied to clipboard!");
                          } catch (e) {
                            // Fallback to manual prompt
                            try {
                              window.prompt("Copy your direct dashboard link:", directUrl);
                            } catch (err) {
                              console.warn("Unable to copy URL:", err);
                            }
                          }
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-emerald-500 hover:text-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg border-none cursor-pointer transition flex items-center gap-1 text-[9px] font-black uppercase tracking-wider"
                        title="Copy direct shareable link of this dashboard"
                      >
                        <Share2 size={12} /> Share Dashboard
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-0.5 text-[9px] bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-300 font-extrabold rounded-lg uppercase tracking-wider">
                        {selectedPlayerForView.role}
                      </span>
                      <span className="px-2.5 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-black rounded-lg uppercase tracking-wider flex items-center gap-1">
                        <Star size={10} className="fill-emerald-500 text-emerald-500" />
                        Rating {selectedPlayerForView.performanceRating}
                      </span>
                      <span className="px-2.5 py-0.5 text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold rounded-lg uppercase tracking-wider">
                        ₹{(selectedPlayerForView.peakAuctionPrice || 0).toLocaleString("en-IN")} Appraisal Price
                      </span>
                    </div>

                    {/* Email and Mobile */}
                    <div className="flex flex-wrap text-xs font-semibold text-slate-400 dark:text-slate-500 gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1.5">
                        <Mail size={12} /> {selectedPlayerForView.email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone size={12} /> +91 {selectedPlayerForView.mobile}
                      </span>
                      {selectedPlayerForView.dob && (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} /> DOB: {selectedPlayerForView.dob}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Inner Dashboard Layout Grid */}
              <div className="p-6 md:p-8 space-y-8">
                {/* SUPER ADMIN REGISTRATION DOSSIER PANEL */}
                {isSuperAdmin && isAdminMode && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-205 dark:border-slate-800 rounded-3xl p-5 md:p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider flex items-center gap-1.5">
                        <Lock size={14} className="text-emerald-500" /> Submitted Registration Dossier (Super Admin Cockpit)
                      </h4>
                      <span className="px-2 py-0.5 text-[8px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-extrabold rounded-md uppercase tracking-wider">
                        Authorized Access Only
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {/* Personal Meta */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Personal Identity Info</h5>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-400">Gender:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedPlayerForView.gender || "Not specified"}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-400">Date of Birth:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedPlayerForView.dob || "Not specified"}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-400">Emergency Contact:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedPlayerForView.emergencyContact || "Not specified"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Cricket Meta */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Technical Style Coordinates</h5>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-400">Playing Role:</span>
                            <span className="text-emerald-600 dark:text-emerald-450 font-extrabold">{selectedPlayerForView.role || "Not specified"}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-400">Batting Hand:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedPlayerForView.battingStyle || "Not specified"}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-400">Bowling Style:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedPlayerForView.bowlingStyle || "Not specified"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Submitted Identity Document proof */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Identity Proof Document</h5>
                        {selectedPlayerForView.idDocument ? (
                          <div className="space-y-2">
                            {selectedPlayerForView.idDocument.startsWith("data:image/") ? (
                              <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                                <img
                                  src={selectedPlayerForView.idDocument}
                                  alt="ID Document"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <a
                                  href={selectedPlayerForView.idDocument}
                                  download={`ID_document_${selectedPlayerForView.fullName}.jpg`}
                                  className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] font-black text-white uppercase no-underline tracking-wider"
                                >
                                  Download ID
                                </a>
                              </div>
                            ) : (
                              <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-205 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-505">Document Uploaded</span>
                                <a
                                  href={selectedPlayerForView.idDocument}
                                  download={`ID_document_${selectedPlayerForView.fullName}`}
                                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-[9px] font-black uppercase tracking-wider text-center no-underline cursor-pointer"
                                >
                                  Download
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 bg-rose-500/5 dark:bg-rose-950/5 border border-dashed border-rose-500/10 rounded-xl text-center">
                            <span className="text-[10px] font-bold text-rose-505 uppercase">No ID Proof Uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* CAREER SUMMARY METRICS CARD ROW */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-55 dark:bg-slate-950/30 p-4 rounded-3xl border border-slate-105 dark:border-slate-850">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Matches Played</span>
                    <strong className="text-2xl font-black text-slate-900 dark:text-white font-mono">{selectedPlayerForView.matchesPlayed || 0}</strong>
                    <div className="text-[9px] text-slate-405 font-bold uppercase mt-1">Total Career Matches</div>
                  </div>

                  <div className="bg-emerald-50/20 dark:bg-emerald-950/10 p-4 rounded-3xl border border-emerald-500/5">
                    <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-bold uppercase tracking-wider block mb-1">Batting Runs</span>
                    <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{selectedPlayerForView.totalRuns || 0}</strong>
                    <div className="text-[9px] text-slate-405 font-semibold mt-1">
                      Avg: <span className="font-bold text-slate-600 dark:text-slate-200">{modalStats.battingAvg}</span> | High Score: <span className="font-extrabold text-emerald-650">{selectedPlayerForView.highestScore || 0}</span>
                    </div>
                  </div>

                  <div className="bg-slate-55 dark:bg-slate-950/30 p-4 rounded-3xl border border-slate-105 dark:border-slate-850">
                    <span className="text-[10px] text-slate-404 font-bold uppercase tracking-wider block mb-1">Batting Strike Rate</span>
                    <strong className="text-2xl font-black text-slate-900 dark:text-white font-mono">{modalStats.battingStrikeRate}%</strong>
                    <div className="text-[9px] text-slate-405 mt-1 font-semibold">Faced {modalStats.totalBallsFaced} deliveries</div>
                  </div>

                  <div className="bg-blue-50/20 dark:bg-blue-950/10 p-4 rounded-3xl border border-blue-500/5">
                    <span className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-bold uppercase tracking-wider block mb-1">Wickets Taken</span>
                    <strong className="text-2xl font-black text-blue-505 dark:text-blue-400 font-mono">{selectedPlayerForView.wicketsTaken || 0}</strong>
                    <div className="text-[9px] text-slate-405 font-semibold mt-1">
                      Best: <span className="font-extrabold text-blue-505">{selectedPlayerForView.bestBowling || "0/0"}</span> | Econ: <span className="font-bold text-slate-600 dark:text-slate-200">{modalStats.economyRate}</span>
                    </div>
                  </div>
                </div>

                {/* VISUAL RECHARTS PROGRESS CHART */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-emerald-500" /> Career Regression & Form Progression Chart
                    </h4>
                    <span className="text-[10px] font-bold text-slate-404 dark:text-slate-500 uppercase tracking-wider font-mono">Completed Games</span>
                  </div>

                  <div className="bg-slate-950 dark:bg-slate-950/80 p-5 rounded-3xl border border-slate-800">
                    {modalStats.chartPoints.length > 0 ? (
                      <div className="w-full h-48 md:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={modalStats.chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="runsGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="wicketsGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "1rem" }}
                              itemStyle={{ color: "#f8fafc", fontSize: "11px" }}
                              labelStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "#64748b" }}
                            />
                            <Area type="monotone" dataKey="runs" name="Runs Scored" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#runsGrad)" />
                            <Area type="monotone" dataKey="wickets" name="Wickets Taken" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#wicketsGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <Activity className="text-slate-600 animate-pulse" size={24} />
                        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider text-center">
                          Form progression graphs will load after registering completed match logs
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* MATCH-BY-MATCH HISTORY TIMELINE LIST */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5 pt-2">
                    <Activity size={14} className="text-emerald-500" /> Match Records Timeline Roster ({playerMatchHistory.length})
                  </h4>

                  {playerMatchHistory.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider text-slate-505">No active matches logged for this player yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {playerMatchHistory.map((item: any, idx) => (
                        <div
                          key={item.id || idx}
                          className="p-4 bg-slate-50 dark:bg-slate-950/45 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3"
                        >
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                              {item.matchName}
                            </h5>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>{item.date}</span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span className="uppercase text-emerald-500 font-black">{item.status}</span>
                            </div>
                          </div>

                          {/* Specific stats outputs */}
                          <div className="flex gap-4 self-start sm:self-center">
                            {item.batting && (
                              <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 px-3 py-1.5 rounded-xl text-right min-w-[80px]">
                                <span className="block text-[8px] uppercase font-bold text-slate-400">Batting</span>
                                <strong className="text-xs font-mono font-black">{item.batting.runs}</strong>
                                <span className="text-[9px] font-semibold text-slate-400 block sm:inline sm:ml-1">({item.batting.balls}b)</span>
                              </div>
                            )}
                            
                            {item.bowling && (
                              <div className="bg-blue-500/10 text-blue-600 dark:text-blue-450 px-3 py-1.5 rounded-xl text-right min-w-[80px]">
                                <span className="block text-[8px] uppercase font-bold text-slate-400">Bowling</span>
                                <strong className="text-xs font-mono font-black">{item.bowling.wickets} W</strong>
                                <span className="text-[9px] font-semibold text-slate-400 block sm:inline sm:ml-1">({item.bowling.overs} ov)</span>
                              </div>
                            )}

                            {!item.batting && !item.bowling && (
                              <div className="bg-slate-100 dark:bg-slate-800 text-slate-450 dark:text-slate-505 px-3 py-1.5 rounded-xl text-center min-w-[80px] flex items-center justify-center text-[9px] font-extrabold uppercase">
                                Squad Player
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dismiss footer block panel */}
              <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-950/25 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedPlayerForView(null)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none transition"
                >
                  Close Performance Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
