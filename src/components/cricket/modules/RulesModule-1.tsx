import React, { useState } from 'react';
import { Settings, Users, Key, CheckSquare, RefreshCw, Radio, Sparkles, Coins, HelpCircle } from 'lucide-react';
import { Player, Team } from '../CricketAuction';

interface RulesModuleProps {
  minPlayersPerTeam: number;
  setMinPlayersPerTeam: (val: number) => void;
  maxPlayersPerTeam: number;
  setMaxPlayersPerTeam: (val: number) => void;
  maxOverseasPlayers: number;
  setMaxOverseasPlayers: (val: number) => void;
  mandatorySquadCount: number;
  setMandatorySquadCount: (val: number) => void;
  autoIncrementEnabled: boolean;
  setAutoIncrementEnabled: (val: boolean) => void;
  rtmEnabled: boolean;
  setRtmEnabled: (val: boolean) => void;
  userRoles: any[];
  activeUserRole: string;
  setActiveUserRole: (val: string) => void;
  players: Player[];
  setPlayers: (val: Player[]) => void;
  teams: Team[];
  setTeams: (val: Team[]) => void;
  formatPrice: (val: number) => string;
  showNotification: (text: string, type?: 'success' | 'alert' | 'info') => void;
  dispatchGatewayAlert: (service: 'WhatsApp' | 'SMS' | 'Email', text: string) => void;
  setAuctionIndex: (index: number) => void;
  setCurrentBidPrice: (price: number) => void;
  setHighestBidderId: (id: string | null) => void;
  setTimeLeft: (time: number) => void;
  setTimerActive: (active: boolean) => void;
  onStateUpdate: (t: Team[], p: Player[]) => void;
}

export const RulesModule: React.FC<RulesModuleProps> = ({
  minPlayersPerTeam, setMinPlayersPerTeam,
  maxPlayersPerTeam, setMaxPlayersPerTeam,
  maxOverseasPlayers, setMaxOverseasPlayers,
  mandatorySquadCount, setMandatorySquadCount,
  autoIncrementEnabled, setAutoIncrementEnabled,
  rtmEnabled, setRtmEnabled,
  userRoles, activeUserRole, setActiveUserRole,
  players, setPlayers,
  teams, setTeams,
  formatPrice,
  showNotification,
  dispatchGatewayAlert,
  setAuctionIndex,
  setCurrentBidPrice,
  setHighestBidderId,
  setTimeLeft,
  setTimerActive,
  onStateUpdate
}) => {
  const [rtmPlayerId, setRtmPlayerId] = useState<string>('');
  const [rtmBuyerTeamId, setRtmBuyerTeamId] = useState<string>('');
  const [rtmMatchingTeamId, setRtmMatchingTeamId] = useState<string>('');
  const [rtmFinalPrice, setRtmFinalPrice] = useState<string>('5.0');

  const unsoldPlayers = players.filter(p => p.status === 'Unsold' || p.status === 'Skipped');

  // Nominates an unsold candidate instantly back to active hot seat
  const handleAcceleratePlayer = (pId: string) => {
    const idx = players.findIndex(p => p.id === pId);
    if (idx >= 0) {
      setAuctionIndex(idx);
      const targetP = players[idx];
      setCurrentBidPrice(targetP.basePrice);
      setHighestBidderId(null);
      setTimeLeft(30);
      setTimerActive(true);
      showNotification(`Accelerated nominating ${targetP.name} into central hot seat!`, 'success');
      dispatchGatewayAlert('SMS', `⚡ [Accelerated Round] Commissioner Admin nominated ${targetP.name} to hot seat (Base ${formatPrice(targetP.basePrice)}).`);
    }
  };

  const executeRtmContract = () => {
    if (!rtmPlayerId || !rtmBuyerTeamId || !rtmMatchingTeamId) {
      showNotification('Verify that player, highest buyer, and matching franchise are selected!', 'alert');
      return;
    }
    if (rtmBuyerTeamId === rtmMatchingTeamId) {
      showNotification('Matching franchise must be different from high bidder!', 'alert');
      return;
    }
    const finalVal = parseFloat(rtmFinalPrice);
    if (isNaN(finalVal) || finalVal <= 0) {
      showNotification('Key in a valid positive final RTM contract price!', 'alert');
      return;
    }

    const matchingTeam = teams.find(t => t.id === rtmMatchingTeamId);
    if (!matchingTeam) return;

    if (matchingTeam.purse < finalVal) {
      showNotification(`Guardrail: matching team ${matchingTeam.name} has only ${formatPrice(matchingTeam.purse)}, insufficient budget!`, 'alert');
      return;
    }

    const playerObj = players.find(p => p.id === rtmPlayerId);
    if (!playerObj) return;

    // Deduct and assign player
    const updatedTeams = teams.map(t => {
      if (t.id === rtmMatchingTeamId) {
        return { ...t, purse: Number((t.purse - finalVal).toFixed(2)) };
      }
      return t;
    });

    const updatedPlayers = players.map(p => {
      if (p.id === rtmPlayerId) {
        return {
          ...p,
          status: 'Sold' as const,
          soldTo: rtmMatchingTeamId,
          soldPrice: finalVal
        };
      }
      return p;
    });

    setTeams(updatedTeams);
    setPlayers(updatedPlayers);
    onStateUpdate(updatedTeams, updatedPlayers);

    showNotification(`RTM OVERRIDDEN! ${playerObj.name} joins ${matchingTeam.name} matching bid of ${formatPrice(finalVal)} Cr!`, 'success');
    dispatchGatewayAlert('WhatsApp', `🔥 [Right to Match RTM] ${matchingTeam.name} exercised RTM on ${playerObj.name} matching highest bid of ${formatPrice(finalVal)} Cr!`);
    
    // Clear selections
    setRtmPlayerId('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full overflow-y-auto max-h-[calc(100vh-140px)] pr-2 pb-6">
      
      {/* COLUMN 1: RULES & ROLES COCKPIT */}
      <div className="lg:col-span-4 bg-slate-900/60 border border-slate-850 rounded-2xl p-4 space-y-4 flex flex-col justify-between">
        <div>
          <div className="pb-3 border-b border-slate-800 flex items-center gap-2">
            <Settings size={15} className="text-[#f59e0b]" />
            <h3 className="text-xs font-black uppercase tracking-widest text-[#f59e0b]">Rule Engine Config</h3>
          </div>

          <div className="space-y-4 pt-3 text-xs">
            <div>
              <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Roster Limit: Min Players Per Squad</label>
              <input 
                type="number"
                value={minPlayersPerTeam}
                onChange={(e) => setMinPlayersPerTeam(Math.max(1, parseInt(e.target.value) || 5))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-bold font-mono text-white outline-none focus:border-[#f59e0b]"
              />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Roster Limit: Max Players Cap</label>
              <input 
                type="number"
                value={maxPlayersPerTeam}
                onChange={(e) => setMaxPlayersPerTeam(Math.max(1, parseInt(e.target.value) || 11))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-bold font-mono text-white outline-none focus:border-[#f59e0b]"
              />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Overseas Caps per Franchise</label>
              <input 
                type="number"
                value={maxOverseasPlayers}
                onChange={(e) => setMaxOverseasPlayers(Math.max(0, parseInt(e.target.value) || 4))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-bold font-mono text-white outline-none focus:border-[#f59e0b]"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-dashed border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer py-1">
                <input 
                  type="checkbox"
                  checked={autoIncrementEnabled}
                  onChange={(e) => setAutoIncrementEnabled(e.target.checked)}
                  className="rounded border-slate-800 text-amber-500 focus:ring-0 w-3.5 h-3.5 bg-slate-950 cursor-pointer"
                />
                <span className="text-[10px] uppercase font-black text-slate-300">Auto Increment Scaling (+5L to +1Cr)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer py-1">
                <input 
                  type="checkbox"
                  checked={rtmEnabled}
                  onChange={(e) => setRtmEnabled(e.target.checked)}
                  className="rounded border-slate-800 text-amber-500 focus:ring-0 w-3.5 h-3.5 bg-slate-950 cursor-pointer"
                />
                <span className="text-[10px] uppercase font-black text-slate-300">Activate Right to Match Override</span>
              </label>
            </div>
          </div>
        </div>

        {/* Proxy Bid Credentials Assign */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 pb-2">
            <Key size={12} className="text-emerald-400" />
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">User Identity & Proxy Credentials</span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-850/60 space-y-2">
            <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">Logged representing persona:</span>
            <select
              value={activeUserRole}
              onChange={(e) => {
                setActiveUserRole(e.target.value);
                const roleObj = userRoles.find(ur => ur.username === e.target.value);
                showNotification(`Representing role swapped to "${roleObj?.role || 'Guest'}"`, 'info');
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-[10px] font-black text-white outline-none uppercase tracking-wider"
            >
              {userRoles.map((ur) => (
                <option key={ur.username} value={ur.username}>{ur.username.replace('_', ' (')} ({ur.role})</option>
              ))}
            </select>
            <p className="text-[7.5px] text-slate-450 uppercase leading-normal">
              Organizers can representationally switch proxy identifiers to trigger counter bids on behalf of designated Table owners directly.
            </p>
          </div>
        </div>
      </div>

      {/* COLUMN 2: ACCELERATED UNSOLD DRAWS */}
      <div className="lg:col-span-4 bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw size={15} className="text-indigo-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-[#f59e0b]">Unsold Pool Drafts</h3>
            </div>
            <span className="text-[9px] font-black bg-slate-950 px-1.5 py-0.5 rounded text-indigo-400">{unsoldPlayers.length} Left</span>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2 custom-scrollbar">
            {unsoldPlayers.map((p) => (
              <div 
                key={p.id} 
                className="p-2 bg-slate-950/50 border border-slate-850/60 rounded-xl hover:border-slate-800 transition-all flex items-center justify-between gap-1"
              >
                <div>
                  <span className="text-[10px] font-black uppercase block text-white">{p.name}</span>
                  <span className="text-[8px] font-bold uppercase text-slate-500">
                    {p.role} • Base {formatPrice(p.basePrice)}
                  </span>
                </div>
                <button
                  onClick={() => handleAcceleratePlayer(p.id)}
                  className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[8px] font-black uppercase tracking-wider rounded-lg border-none cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
                >
                  <Radio size={8} className="animate-pulse" /> Nominate
                </button>
              </div>
            ))}

            {unsoldPlayers.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-[9px] uppercase font-bold">
                No unsold players currently archived.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COLUMN 3: RIGHT TO MATCH (RTM) CONTRACT DRAW OVERRIDER */}
      <div className="lg:col-span-4 bg-slate-900/60 border border-slate-850 rounded-2xl p-4 space-y-4">
        <div className="pb-3 border-b border-slate-800 flex items-center gap-2">
          <Sparkles size={15} className="text-indigo-400" />
          <h3 className="text-xs font-black uppercase tracking-widest text-[#f59e0b]">RTM Override Panel</h3>
        </div>

        <p className="text-[9px] text-slate-400 uppercase leading-relaxed font-semibold">
          Manually execute physical RTM contract rights. Force-transfer a player status to another team paying the matched highest bid instantly!
        </p>

        <div className="space-y-3.5 pt-1 text-xs">
          <div>
            <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Select Candidate</label>
            <select
              value={rtmPlayerId}
              onChange={(e) => setRtmPlayerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-[10px] font-bold text-white outline-none uppercase"
            >
              <option value="">-- Choose Candidate --</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Select High Bidder Franchise</label>
            <select
              value={rtmBuyerTeamId}
              onChange={(e) => setRtmBuyerTeamId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-[10px] font-bold text-white outline-none uppercase"
            >
              <option value="">-- High Bidder Team --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name} (Purse: {formatPrice(t.purse)})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Matching RTM Franchise</label>
            <select
              value={rtmMatchingTeamId}
              onChange={(e) => setRtmMatchingTeamId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-[10px] font-bold text-white outline-none uppercase"
            >
              <option value="">-- Matching RTM Team --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name} (Purse: {formatPrice(t.purse)})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Final Matching Price (₹ Crores)</label>
            <input 
              type="number"
              step="0.05"
              value={rtmFinalPrice}
              onChange={(e) => setRtmFinalPrice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-bold font-mono text-white outline-none focus:border-[#f59e0b]"
            />
          </div>

          <button
            onClick={executeRtmContract}
            className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/10"
          >
            <Coins size={12} /> Settle RTM Contract Override
          </button>
        </div>
      </div>

    </div>
  );
};
