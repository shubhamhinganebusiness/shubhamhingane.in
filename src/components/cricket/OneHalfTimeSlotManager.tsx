import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock, Calendar, AlertTriangle, Send, Play, Edit2, CheckCircle2,
  Trophy, MapPin, Coffee, Zap, RotateCcw, Share2, X, ChevronRight,
  Filter, Search, Check, Sparkles, AlertCircle, ArrowRight
} from 'lucide-react';
import { OneHalfMatch, OneHalfTeam, OneHalfTournamentState } from './OneHalfTournamentSuite';

// Helper: Convert "08:30 AM" or "14:15" to total minutes from midnight
export const parseTimeToMinutes = (timeStr?: string): number => {
  if (!timeStr) return 9 * 60; // 09:00 AM default
  const clean = timeStr.trim();
  const parts = clean.split(' ');
  if (parts.length >= 2) {
    const [time, modifier] = parts;
    const [h, m] = time.split(':').map(Number);
    let hours = isNaN(h) ? 9 : h;
    const minutes = isNaN(m) ? 0 : m;
    if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  } else {
    // 24-hour fallback like "09:00"
    const [h, m] = clean.split(':').map(Number);
    return (isNaN(h) ? 9 : h) * 60 + (isNaN(m) ? 0 : m);
  }
};

// Helper: Convert total minutes from midnight to "08:30 AM" format
export const formatMinutesToTimeStr = (totalMins: number): string => {
  const normalized = ((totalMins % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMins = mins < 10 ? `0${mins}` : `${mins}`;
  return `${displayHours < 10 ? '0' : ''}${displayHours}:${displayMins} ${period}`;
};

// Helper: Add minutes to time string
export const addMinutesToTimeStr = (timeStr: string, minsToAdd: number): string => {
  const currentMins = parseTimeToMinutes(timeStr);
  return formatMinutesToTimeStr(currentMins + minsToAdd);
};

// Default standard slots for 7 matches on Days 1 to 4
export const getDefaultDay1To4Slots = (
  startHour: number = 8,
  startMinute: number = 30,
  matchDurationMins: number = 75,
  lunchBreakMins: number = 45
): { time: string; reportingTime: string }[] => {
  const slots: { time: string; reportingTime: string }[] = [];
  let currentMins = startHour * 60 + startMinute;

  // Matches 1 to 4 (Round 1)
  for (let i = 0; i < 4; i++) {
    const time = formatMinutesToTimeStr(currentMins);
    const reportingTime = formatMinutesToTimeStr(currentMins - 30);
    slots.push({ time, reportingTime });
    currentMins += matchDurationMins;
  }

  // Lunch / Ground maintenance break after Match 4
  currentMins += lunchBreakMins;

  // Matches 5 and 6 (Semi-Finals)
  for (let i = 0; i < 2; i++) {
    const time = formatMinutesToTimeStr(currentMins);
    const reportingTime = formatMinutesToTimeStr(currentMins - 30);
    slots.push({ time, reportingTime });
    currentMins += matchDurationMins;
  }

  // Short rest before Group Final (15 mins)
  currentMins += 15;

  // Match 7 (Group Final)
  const finalTime = formatMinutesToTimeStr(currentMins);
  const finalReportingTime = formatMinutesToTimeStr(currentMins - 30);
  slots.push({ time: finalTime, reportingTime: finalReportingTime });

  return slots;
};

// Default standard slots for 4 matches on Day 5 (Finals Day)
export const getDefaultDay5Slots = (
  startHour: number = 9,
  startMinute: number = 30,
  matchDurationMins: number = 90,
  lunchBreakMins: number = 60
): { time: string; reportingTime: string }[] => {
  const slots: { time: string; reportingTime: string }[] = [];
  let currentMins = startHour * 60 + startMinute;

  // SF1
  slots.push({
    time: formatMinutesToTimeStr(currentMins),
    reportingTime: formatMinutesToTimeStr(currentMins - 30)
  });
  currentMins += matchDurationMins + 15;

  // SF2
  slots.push({
    time: formatMinutesToTimeStr(currentMins),
    reportingTime: formatMinutesToTimeStr(currentMins - 30)
  });
  currentMins += matchDurationMins + lunchBreakMins;

  // 3rd & 4th Place Match
  slots.push({
    time: formatMinutesToTimeStr(currentMins),
    reportingTime: formatMinutesToTimeStr(currentMins - 30)
  });
  currentMins += matchDurationMins + 20;

  // Grand Final
  slots.push({
    time: formatMinutesToTimeStr(currentMins),
    reportingTime: formatMinutesToTimeStr(currentMins - 30)
  });

  return slots;
};

// Helper: Format date nicely
export const formatDateLabel = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

// WhatsApp alert link for Captain Reporting
export const getCaptainAlertWhatsAppUrl = (
  match: OneHalfMatch,
  tournament: OneHalfTournamentState
): string => {
  const scheduledTime = match.time || 'TBD';
  const reportingTime = match.reportingTime || addMinutesToTimeStr(scheduledTime, -30);
  const dateFormatted = match.date ? formatDateLabel(match.date) : `Day ${match.day}`;
  const pitch = match.pitchVenue || tournament.groundName;

  const text = `🏏 *OFFICIAL MATCH REPORTING CALL*\n🏆 *${tournament.name.toUpperCase()}*\n━━━━━━━━━━━━━━━━━━━━\n⚔️ *Match ${match.matchNumber}:* ${match.teamA} 🆚 ${match.teamB}\n📌 *Stage:* Day ${match.day} • ${match.label.split(' - ')[1] || match.label}\n\n🗓️ *Date:* ${dateFormatted}\n⏰ *Scheduled Toss & Match:* ${scheduledTime}\n🚨 *MANDATORY REPORTING TIME:* ${reportingTime}\n📍 *Venue:* ${pitch}\n⚡ *Format:* ${tournament.overs} Overs per side | ${tournament.ballType}\n\n⚠️ *GROUND BYE-LAWS:* \n1. Team captains must report to the scorer's tent by *${reportingTime}* for toss.\n2. Playing XI list with captain signature must be submitted before toss.\n3. Late arrival (>15 mins) forfeits toss decision.\n\n_Shared via GullyScore Tournament Suite_`;

  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

// WhatsApp share link for entire Day's schedule
export const getDayScheduleWhatsAppUrl = (
  day: number,
  matches: OneHalfMatch[],
  tournament: OneHalfTournamentState
): string => {
  const dayMatches = matches.filter(m => m.day === day);
  const dateFormatted = dayMatches[0]?.date ? formatDateLabel(dayMatches[0].date) : `Day ${day}`;

  let scheduleList = '';
  dayMatches.forEach(m => {
    const statusSymbol = m.status === 'completed' ? '✅' : m.status === 'in_progress' ? '🔴 LIVE' : m.status === 'delayed' ? '⚠️ DELAYED' : '⏳';
    scheduleList += `\n${statusSymbol} *M${m.matchNumber} (${m.time || 'TBD'} | Report: ${m.reportingTime || '30m prior'}):*\n  ${m.teamA} vs ${m.teamB}\n  _${m.label.split(' - ')[1] || m.label}_\n`;
  });

  const text = `📋 *ORDER OF PLAY: DAY ${day} SCHEDULE*\n🏆 *${tournament.name.toUpperCase()}*\n📍 Venue: ${tournament.groundName}\n🗓️ Date: ${dateFormatted}\n━━━━━━━━━━━━━━━━━━━━\n${scheduleList}\n━━━━━━━━━━━━━━━━━━━━\n⚡ Overs: ${tournament.overs} Overs | Ball: ${tournament.ballType}\n⚠️ *Note:* All teams must report 30 minutes before their scheduled match time.`;

  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

// Status badge styling helper
export const getStatusBadgeConfig = (status?: string, delayMins?: number) => {
  switch (status) {
    case 'in_progress':
    case 'live':
      return {
        label: '🔴 LIVE IN PLAY',
        bg: 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse font-black'
      };
    case 'toss':
      return {
        label: '🪙 TOSS TIME',
        bg: 'bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse font-black'
      };
    case 'delayed':
      return {
        label: `⚠️ DELAYED ${delayMins ? `(+${delayMins}m)` : ''}`,
        bg: 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 font-bold'
      };
    case 'break':
      return {
        label: '☕ INNINGS / LUNCH BREAK',
        bg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
      };
    case 'completed':
      return {
        label: 'FINISHED ✓',
        bg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
      };
    case 'abandoned':
      return {
        label: 'ABANDONED / NO RESULT',
        bg: 'bg-slate-700/40 text-slate-400 border border-slate-600 font-bold'
      };
    default:
      return {
        label: 'UPCOMING',
        bg: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-bold'
      };
  }
};

/* ==========================================================================
   COMPONENT: Time Slot Edit Modal
   ========================================================================== */
interface TimeSlotEditModalProps {
  match: OneHalfMatch;
  groundName: string;
  onClose: () => void;
  onSave: (updated: Partial<OneHalfMatch>) => void;
}

export const TimeSlotEditModal: React.FC<TimeSlotEditModalProps> = ({
  match,
  groundName,
  onClose,
  onSave
}) => {
  const [time, setTime] = useState(match.time || '08:30 AM');
  const [reportingTime, setReportingTime] = useState(
    match.reportingTime || addMinutesToTimeStr(match.time || '08:30 AM', -30)
  );
  const [date, setDate] = useState(
    match.date || new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<OneHalfMatch['status']>(match.status || 'upcoming');
  const [delayMins, setDelayMins] = useState<number>(match.delayMins || 0);
  const [pitchVenue, setPitchVenue] = useState(match.pitchVenue || groundName);
  const [matchNotes, setMatchNotes] = useState(match.matchNotes || '');
  const [autoSyncReporting, setAutoSyncReporting] = useState(true);

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (autoSyncReporting) {
      setReportingTime(addMinutesToTimeStr(newTime, -30));
    }
  };

  const handleApplyDelay = (mins: number) => {
    const updatedTime = addMinutesToTimeStr(time, mins);
    setTime(updatedTime);
    setReportingTime(addMinutesToTimeStr(updatedTime, -30));
    setDelayMins(prev => (prev || 0) + mins);
    if (status !== 'completed' && status !== 'in_progress') {
      setStatus('delayed');
    }
  };

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
              <Clock size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">
                Match Time & Slot Manager
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Match #{match.matchNumber} • {match.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Match Header Pill */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
          <div className="truncate">
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Fixture</span>
            <strong className="text-xs font-black text-white truncate block">
              {match.teamA} <span className="text-amber-400">vs</span> {match.teamB}
            </strong>
          </div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 shrink-0">
            Day {match.day}
          </span>
        </div>

        {/* Time Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
              <Calendar size={11} className="text-amber-400" /> Match Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
              <Clock size={11} className="text-amber-400" /> Match Start Time
            </label>
            <input
              type="text"
              value={time}
              onChange={e => handleTimeChange(e.target.value)}
              placeholder="e.g. 08:30 AM"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
            />
          </div>
        </div>

        {/* Reporting Time with Auto-sync toggle */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <AlertTriangle size={11} className="text-rose-400" />
              Captain Reporting Time (Toss Call)
            </label>
            <label className="text-[9.5px] font-semibold text-slate-400 flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSyncReporting}
                onChange={e => setAutoSyncReporting(e.target.checked)}
                className="rounded accent-amber-500"
              />
              Auto-set 30m prior
            </label>
          </div>
          <input
            type="text"
            value={reportingTime}
            onChange={e => {
              setReportingTime(e.target.value);
              setAutoSyncReporting(false);
            }}
            placeholder="e.g. 08:00 AM"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-amber-300 font-bold outline-none focus:border-amber-400 font-mono"
          />
        </div>

        {/* Quick Delay Adjustment Buttons */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Zap size={11} /> Quick Delay Adder (Runs Late)
            </span>
            {delayMins > 0 && (
              <span className="text-[9px] font-mono font-bold text-amber-400">
                Current Delay: +{delayMins} mins
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[10, 15, 20, 30, 45].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => handleApplyDelay(m)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-[10px] font-black uppercase cursor-pointer transition active:scale-95"
              >
                +{m}m Delay
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setDelayMins(0);
                if (status === 'delayed') setStatus('upcoming');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer transition"
            >
              Reset Delay
            </button>
          </div>
        </div>

        {/* Match Status Selector */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
            Match Status / Badge
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'upcoming', label: 'Upcoming', icon: '⏳' },
              { id: 'toss', label: 'Toss Time', icon: '🪙' },
              { id: 'in_progress', label: 'In Progress (Live)', icon: '🔴' },
              { id: 'delayed', label: 'Delayed', icon: '⚠️' },
              { id: 'break', label: 'In Break', icon: '☕' },
              { id: 'completed', label: 'Finished', icon: '✅' },
            ].map(st => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatus(st.id as any)}
                className={`p-2 rounded-xl border text-[10.5px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition ${
                  status === st.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{st.icon}</span>
                <span className="truncate">{st.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pitch / Venue & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Ground Pitch / Court
            </label>
            <input
              type="text"
              value={pitchVenue}
              onChange={e => setPitchVenue(e.target.value)}
              placeholder="e.g. Main Turf Pitch 1"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Ground / Umpire Notes
            </label>
            <input
              type="text"
              value={matchNotes}
              onChange={e => setMatchNotes(e.target.value)}
              placeholder="e.g. 6-overs limit if delayed"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onSave({
                  time,
                  reportingTime,
                  date,
                  status,
                  delayMins,
                  pitchVenue,
                  matchNotes
                });
                onClose();
              }}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl border-none cursor-pointer shadow-lg transition active:scale-95"
            >
              Save Schedule
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ==========================================================================
   COMPONENT: Auto Schedule Day Modal (Bulk Slot Generator)
   ========================================================================== */
interface AutoScheduleModalProps {
  day: number;
  tournament: OneHalfTournamentState;
  onClose: () => void;
  onApplySlots: (daySlots: { matchId: string; time: string; reportingTime: string; date: string }[]) => void;
}

export const AutoScheduleModal: React.FC<AutoScheduleModalProps> = ({
  day,
  tournament,
  onClose,
  onApplySlots
}) => {
  const [startHour, setStartHour] = useState(day === 5 ? 9 : 8);
  const [startMinute, setStartMinute] = useState(30);
  const [matchDuration, setMatchDuration] = useState(day === 5 ? 90 : 75);
  const [lunchBreak, setLunchBreak] = useState(day === 5 ? 60 : 45);
  const [scheduleDate, setScheduleDate] = useState(() => {
    if (tournament.startDate) {
      const base = new Date(tournament.startDate);
      base.setDate(base.getDate() + (day - 1));
      return base.toISOString().split('T')[0];
    }
    const today = new Date();
    today.setDate(today.getDate() + (day - 1));
    return today.toISOString().split('T')[0];
  });

  const dayMatches = tournament.matches.filter(m => m.day === day);

  const previewSlots = day === 5
    ? getDefaultDay5Slots(startHour, startMinute, matchDuration, lunchBreak)
    : getDefaultDay1To4Slots(startHour, startMinute, matchDuration, lunchBreak);

  const handleApply = () => {
    const assignments = dayMatches.map((m, idx) => {
      const slot = previewSlots[idx] || {
        time: formatMinutesToTimeStr(startHour * 60 + startMinute + idx * matchDuration),
        reportingTime: formatMinutesToTimeStr(startHour * 60 + startMinute + idx * matchDuration - 30)
      };
      return {
        matchId: m.id,
        time: slot.time,
        reportingTime: slot.reportingTime,
        date: scheduleDate
      };
    });

    onApplySlots(assignments);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <Zap size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400">
                Auto-Assign Day {day} Time Slots
              </h3>
              <p className="text-[10px] text-slate-400">
                Bulk calculate all {dayMatches.length} match timings & reporting calls in 1 click
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 font-sans">
          {/* Day Date */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Target Date for Day {day}
            </label>
            <input
              type="date"
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Start Time Config */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                First Match Start Hour
              </label>
              <select
                value={startHour}
                onChange={e => setStartHour(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500"
              >
                <option value={7}>07:00 AM (Early Morning)</option>
                <option value={8}>08:00 AM (Standard)</option>
                <option value={9}>09:00 AM</option>
                <option value={10}>10:00 AM</option>
                <option value={14}>02:00 PM (Afternoon / Floodlights)</option>
                <option value={16}>04:00 PM (Evening / Night)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Start Minute
              </label>
              <select
                value={startMinute}
                onChange={e => setStartMinute(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500"
              >
                <option value={0}>:00</option>
                <option value={15}>:15</option>
                <option value={30}>:30</option>
                <option value={45}>:45</option>
              </select>
            </div>
          </div>

          {/* Durations */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Match Interval (Mins)
              </label>
              <select
                value={matchDuration}
                onChange={e => setMatchDuration(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500"
              >
                <option value={45}>45 Mins (Fast Box / 5 Overs)</option>
                <option value={60}>60 Mins (6-8 Overs)</option>
                <option value={75}>75 Mins (8-10 Overs - Recommended)</option>
                <option value={90}>90 Mins (10-12 Overs)</option>
                <option value={120}>120 Mins (T20 Format)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Lunch / Maintenance Break
              </label>
              <select
                value={lunchBreak}
                onChange={e => setLunchBreak(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500"
              >
                <option value={15}>15 Mins (Quick Water Break)</option>
                <option value={30}>30 Mins</option>
                <option value={45}>45 Mins (Standard Lunch)</option>
                <option value={60}>60 Mins (Full Meal Break)</option>
              </select>
            </div>
          </div>

          {/* Generated Preview */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
              Generated Schedule Preview ({dayMatches.length} Matches)
            </span>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {dayMatches.map((m, idx) => {
                const slot = previewSlots[idx];
                return (
                  <div
                    key={m.id}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="truncate pr-2">
                      <strong className="text-white text-[11px] block truncate">
                        M{m.matchNumber}: {m.teamA} vs {m.teamB}
                      </strong>
                      <span className="text-[9.5px] text-slate-400 block truncate">
                        {m.label.split(' - ')[1] || m.label}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-emerald-400 font-mono font-black text-xs block">
                        {slot?.time || 'TBD'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono block">
                        Report: {slot?.reportingTime || 'TBD'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl border-none cursor-pointer shadow-lg transition active:scale-95"
          >
            Apply Slots to Day {day}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ==========================================================================
   COMPONENT: Batch Day Delay Adder Modal
   ========================================================================== */
interface BatchDelayModalProps {
  day: number;
  onClose: () => void;
  onApplyDelay: (mins: number) => void;
}

export const BatchDelayModal: React.FC<BatchDelayModalProps> = ({
  day,
  onClose,
  onApplyDelay
}) => {
  const [delay, setDelay] = useState(15);

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="relative z-10 w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-black">
              <AlertTriangle size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-yellow-400">
                Ground Delay Manager
              </h3>
              <p className="text-[10px] text-slate-400">
                Bump all upcoming matches on Day {day}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Innings running late or weather hold? Select how many minutes to postpone all remaining upcoming/live matches on <strong>Day {day}</strong>. Start times and reporting deadlines will automatically adjust.
          </p>

          <div className="grid grid-cols-4 gap-2">
            {[10, 15, 20, 30, 45, 60, 90, 120].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setDelay(m)}
                className={`p-2.5 rounded-xl border text-xs font-black uppercase tracking-wider cursor-pointer transition ${
                  delay === m
                    ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                +{m}m
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApplyDelay(delay);
              onClose();
            }}
            className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl border-none cursor-pointer shadow-lg transition active:scale-95"
          >
            Postpone +{delay} Mins
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ==========================================================================
   COMPONENT: Timeline / Order of Play View
   ========================================================================== */
interface MatchScheduleTimelineViewProps {
  day: number;
  tournament: OneHalfTournamentState;
  onEditSlot: (match: OneHalfMatch) => void;
  onQuickStatusChange: (matchId: string, status: OneHalfMatch['status']) => void;
  onLaunchLive: (match: OneHalfMatch) => void;
  onQuickScore: (match: OneHalfMatch) => void;
}

export const MatchScheduleTimelineView: React.FC<MatchScheduleTimelineViewProps> = ({
  day,
  tournament,
  onEditSlot,
  onQuickStatusChange,
  onLaunchLive,
  onQuickScore
}) => {
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const dayMatches = tournament.matches.filter(m => m.day === day);

  const filteredMatches = dayMatches.filter(m => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'pending' && m.status === 'completed') return false;
      if (filterStatus === 'completed' && m.status !== 'completed') return false;
      if (filterStatus === 'live' && m.status !== 'in_progress' && m.status !== 'live') return false;
    }
    if (filterText) {
      const q = filterText.toLowerCase();
      return (
        m.teamA.toLowerCase().includes(q) ||
        m.teamB.toLowerCase().includes(q) ||
        m.label.toLowerCase().includes(q) ||
        m.matchNumber.toString().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Search teams or match in Day schedule..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Slots' },
            { id: 'pending', label: 'Pending / Ready' },
            { id: 'live', label: 'Live' },
            { id: 'completed', label: 'Completed' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold uppercase tracking-wider cursor-pointer transition whitespace-nowrap border ${
                filterStatus === f.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chronological List of Matches */}
      <div className="space-y-3">
        {filteredMatches.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            No matches matching current filter.
          </div>
        ) : (
          filteredMatches.map(match => {
            const isCompleted = match.status === 'completed';
            const isLive = match.status === 'in_progress' || match.status === 'live';
            const badge = getStatusBadgeConfig(match.status, match.delayMins);
            const isReadyToPlay =
              match.teamA &&
              match.teamB &&
              !match.teamA.startsWith('Winner') &&
              !match.teamB.startsWith('Winner') &&
              !match.teamA.startsWith('Day ') &&
              !match.teamB.startsWith('Day ');

            return (
              <div
                key={match.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isLive
                    ? 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/40 shadow-md ring-1 ring-rose-500/20'
                    : isCompleted
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-90'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400/50 shadow-xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Timing Column */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex flex-col items-center justify-center font-mono">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none">M#</span>
                      <strong className="text-base font-black leading-tight text-amber-500">{match.matchNumber}</strong>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono tracking-tight">
                          {match.time || '08:30 AM'}
                        </strong>
                        <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400 font-bold">
                          <AlertTriangle size={10} /> Report: {match.reportingTime || '30m prior'}
                        </span>
                        {match.date && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{formatDateLabel(match.date)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Teams & Scores */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                      <span>{match.label}</span>
                      {match.pitchVenue && (
                        <span className="text-emerald-500 flex items-center gap-0.5">
                          • <MapPin size={9} /> {match.pitchVenue}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Team A */}
                      <div
                        className={`p-2 rounded-xl flex items-center justify-between border ${
                          match.winner === match.teamA
                            ? 'bg-emerald-500/15 border-emerald-500/30'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {match.winner === match.teamA ? (
                            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-[9px] font-bold flex items-center justify-center text-slate-500 shrink-0">
                              A
                            </span>
                          )}
                          <strong
                            className={`text-xs truncate ${
                              match.winner === match.teamA
                                ? 'text-emerald-600 dark:text-emerald-400 font-black'
                                : 'text-slate-800 dark:text-slate-200 font-bold'
                            }`}
                          >
                            {match.teamA}
                          </strong>
                        </div>
                        {match.scoreA && (
                          <span className="text-xs font-mono font-black text-slate-700 dark:text-slate-300 ml-2">
                            {match.scoreA}
                          </span>
                        )}
                      </div>

                      {/* Team B */}
                      <div
                        className={`p-2 rounded-xl flex items-center justify-between border ${
                          match.winner === match.teamB
                            ? 'bg-emerald-500/15 border-emerald-500/30'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {match.winner === match.teamB ? (
                            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-[9px] font-bold flex items-center justify-center text-slate-500 shrink-0">
                              B
                            </span>
                          )}
                          <strong
                            className={`text-xs truncate ${
                              match.winner === match.teamB
                                ? 'text-emerald-600 dark:text-emerald-400 font-black'
                                : 'text-slate-800 dark:text-slate-200 font-bold'
                            }`}
                          >
                            {match.teamB}
                          </strong>
                        </div>
                        {match.scoreB && (
                          <span className="text-xs font-mono font-black text-slate-700 dark:text-slate-300 ml-2">
                            {match.scoreB}
                          </span>
                        )}
                      </div>
                    </div>

                    {match.matchNotes && (
                      <div className="mt-1 text-[9.5px] text-amber-500/90 font-medium italic">
                        Note: {match.matchNotes}
                      </div>
                    )}
                  </div>

                  {/* Right: Quick Action Controls */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    {/* Send Captain WhatsApp Call */}
                    <a
                      href={getCaptainAlertWhatsAppUrl(match, tournament)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 no-underline"
                      title="Send WhatsApp Match Reporting Notice to Captains"
                    >
                      <Send size={11} />
                      <span>Captain Alert</span>
                    </a>

                    {/* Edit Time Slot */}
                    <button
                      type="button"
                      onClick={() => onEditSlot(match)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                      title="Edit Match Time, Reporting & Status"
                    >
                      <Clock size={11} className="text-amber-500" />
                      <span>Edit Slot</span>
                    </button>

                    {/* Live Scorer Button */}
                    <button
                      type="button"
                      onClick={() => onLaunchLive(match)}
                      disabled={!isReadyToPlay}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 border-none ${
                        isReadyToPlay
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Play size={11} />
                      <span>Score</span>
                    </button>

                    {/* Quick Result */}
                    <button
                      type="button"
                      onClick={() => onQuickScore(match)}
                      disabled={!isReadyToPlay}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition active:scale-95 border ${
                        isReadyToPlay
                          ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 cursor-pointer'
                          : 'bg-slate-50 dark:bg-slate-850 text-slate-400 border-transparent cursor-not-allowed'
                      }`}
                    >
                      {isCompleted ? 'Edit Result' : 'Quick Result'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ==========================================================================
   COMPONENT: 5-Day Master Fixtures View
   ========================================================================== */
interface Master5DayScheduleViewProps {
  tournament: OneHalfTournamentState;
  onEditSlot: (match: OneHalfMatch) => void;
  onLaunchLive: (match: OneHalfMatch) => void;
  onQuickScore: (match: OneHalfMatch) => void;
}

export const Master5DayScheduleView: React.FC<Master5DayScheduleViewProps> = ({
  tournament,
  onEditSlot,
  onLaunchLive,
  onQuickScore
}) => {
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>('all');

  const matchesToDisplay = selectedDayFilter === 'all'
    ? tournament.matches
    : tournament.matches.filter(m => m.day === selectedDayFilter);

  return (
    <div className="space-y-4">
      {/* Day Selector Pill Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar size={14} className="text-amber-500" />
            Master 5-Day Tournament Schedule & Fixtures (32 Matches)
          </h3>
          <p className="text-[10px] text-slate-400">
            Complete order of play across all 5 tournament days. Ready for printing or WhatsApp broadcast.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedDayFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition border ${
              selectedDayFilter === 'all'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
            }`}
          >
            All 5 Days
          </button>
          {[1, 2, 3, 4, 5].map(d => (
            <button
              key={d}
              onClick={() => setSelectedDayFilter(d)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition border ${
                selectedDayFilter === d
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
              }`}
            >
              Day {d} {d === 5 ? '🏆' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Table-style Order of Play */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="p-3">#</th>
              <th className="p-3">Day / Stage</th>
              <th className="p-3">Scheduled Time</th>
              <th className="p-3">Report Call</th>
              <th className="p-3">Fixture</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {matchesToDisplay.map(m => {
              const badge = getStatusBadgeConfig(m.status, m.delayMins);
              const isReady =
                m.teamA &&
                m.teamB &&
                !m.teamA.startsWith('Winner') &&
                !m.teamB.startsWith('Winner') &&
                !m.teamA.startsWith('Day ') &&
                !m.teamB.startsWith('Day ');

              return (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition">
                  <td className="p-3 font-mono font-bold text-amber-500">M{m.matchNumber}</td>
                  <td className="p-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Day {m.day}</span>
                    <span className="text-[9.5px] text-slate-400 block truncate">{m.label.split(' - ')[1] || m.label}</span>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {m.time || '08:30 AM'}
                    {m.date && <span className="block text-[9px] text-slate-400">{formatDateLabel(m.date)}</span>}
                  </td>
                  <td className="p-3 font-mono text-rose-500 font-bold">
                    {m.reportingTime || '30m prior'}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-black ${m.winner === m.teamA ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'}`}>
                        {m.teamA}
                      </span>
                      <span className="text-slate-400 text-[10px]">vs</span>
                      <span className={`font-black ${m.winner === m.teamB ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'}`}>
                        {m.teamB}
                      </span>
                    </div>
                    {(m.scoreA || m.scoreB) && (
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {m.scoreA || '-'} vs {m.scoreB || '-'}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={getCaptainAlertWhatsAppUrl(m, tournament)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 transition"
                        title="Send Captain WhatsApp Alert"
                      >
                        <Send size={12} />
                      </a>
                      <button
                        type="button"
                        onClick={() => onEditSlot(m)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-none cursor-pointer transition"
                        title="Edit Time Slot"
                      >
                        <Clock size={12} className="text-amber-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onLaunchLive(m)}
                        disabled={!isReady}
                        className={`p-1.5 rounded-lg border-none transition ${
                          isReady
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                        title="Live Scorer"
                      >
                        <Play size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
