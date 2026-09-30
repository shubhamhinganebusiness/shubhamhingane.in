import React, { useState } from 'react';
import { Upload, Share2, Clipboard, FileSpreadsheet, Plus, Star, Link, Grid, Trash2 } from 'lucide-react';
import { Player } from '../CricketAuction';
import Papa from 'papaparse';

interface RegistrationModuleProps {
  players: Player[];
  setPlayers: (val: Player[]) => void;
  formatPrice: (val: number) => string;
  showNotification: (text: string, type?: 'success' | 'alert' | 'info') => void;
  dispatchGatewayAlert: (service: 'WhatsApp' | 'SMS' | 'Email', text: string) => void;
  selfRegName: string;
  setSelfRegName: (val: string) => void;
  selfRegRole: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';
  setSelfRegRole: (val: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper') => void;
  selfRegCountry: 'Indian' | 'Overseas';
  setSelfRegCountry: (val: 'Indian' | 'Overseas') => void;
  selfRegBasePrice: string;
  setSelfRegBasePrice: (val: string) => void;
  selfRegRating: number;
  setSelfRegRating: (val: number) => void;
  selfRegAvatar: string;
  setSelfRegAvatar: (val: string) => void;
  csvBulkText: string;
  setCsvBulkText: (val: string) => void;
  onStateUpdate: (p: Player[]) => void;
}

export const RegistrationModule: React.FC<RegistrationModuleProps> = ({
  players, setPlayers,
  formatPrice,
  showNotification,
  dispatchGatewayAlert,
  selfRegName, setSelfRegName,
  selfRegRole, setSelfRegRole,
  selfRegCountry, setSelfRegCountry,
  selfRegBasePrice, setSelfRegBasePrice,
  selfRegRating, setSelfRegRating,
  selfRegAvatar, setSelfRegAvatar,
  csvBulkText, setCsvBulkText,
  onStateUpdate
}) => {
  const [activeImportTab, setActiveImportTab] = useState<'form' | 'csv' | 'tier'>('form');
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelfRegIsMarquee, setLocalSelfRegIsMarquee] = useState<boolean>(false);

  const handleDeleteCandidate = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete and expel player candidate "${name}"?`)) {
      const updated = players.filter(p => p.id !== id);
      setPlayers(updated);
      onStateUpdate(updated);
      showNotification(`Expelled player candidate "${name}" from pool!`, 'success');
    }
  };

  const filteredCandidates = players.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelfRegister = () => {
    if (!selfRegName.trim()) {
      showNotification('Candidate name is required!', 'alert');
      return;
    }
    const baseP = parseFloat(selfRegBasePrice);
    if (isNaN(baseP) || baseP <= 0) {
      showNotification('Verify that standard base price exceeds zero!', 'alert');
      return;
    }

    const newId = 'p_self_' + Date.now();
    const created: Player = {
      id: newId,
      name: selfRegName.trim(),
      role: selfRegRole,
      country: selfRegCountry,
      basePrice: baseP,
      rating: selfRegRating,
      status: 'Unsold',
      isMarquee: localSelfRegIsMarquee
    };

    const nextP = [...players, created];
    setPlayers(nextP);
    onStateUpdate(nextP);

    showNotification(`Candidate draft profile created: "${created.name}" (Registered via Portal)!`, 'success');
    dispatchGatewayAlert('WhatsApp', `🏆 [Self-Registration System] New player profile registered: ${created.name} (${created.role}, Base ${formatPrice(baseP)}). Marquee: ${localSelfRegIsMarquee ? 'YES' : 'NO'}`);

    // Reset fields
    setSelfRegName('');
    setLocalSelfRegIsMarquee(false);
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedPlayers: Player[] = [];
        const rows = results.data as any[];

        rows.forEach((row) => {
          let name = '';
          let roleRaw = 'Batsman';
          let countryRaw = 'Indian';
          let basePriceRaw = '0.50';
          let ratingRaw = '8';

          if (Array.isArray(row)) {
            name = (row[0] || '').trim();
            roleRaw = (row[1] || 'Batsman').trim();
            countryRaw = (row[2] || 'Indian').trim();
            basePriceRaw = row[3] || '0.50';
            ratingRaw = row[4] || '8';
          } else if (typeof row === 'object' && row !== null) {
            const keys = Object.keys(row);
            const findVal = (possibleKeys: string[]) => {
              const matchedKey = keys.find(k => possibleKeys.some(pk => k.toLowerCase().replace(/[^a-z0-9]/g, '') === pk.toLowerCase().replace(/[^a-z0-9]/g, '')));
              return matchedKey ? row[matchedKey] : undefined;
            };

            name = (findVal(['name', 'playername', 'fullname']) || '').trim();
            roleRaw = (findVal(['role', 'playingrole', 'position', 'specialty']) || 'Batsman').trim();
            countryRaw = (findVal(['nationality', 'country', 'countrystatus']) || 'Indian').trim();
            basePriceRaw = findVal(['baseprice', 'basepricecrores', 'price', 'value']) || '0.50';
            ratingRaw = findVal(['rating', 'starrating', 'quality']) || '8';

            if (!name && keys.length > 0) {
              name = (row[keys[0]] || '').trim();
              roleRaw = (row[keys[1]] || 'Batsman').trim();
              countryRaw = (row[keys[2]] || 'Indian').trim();
              basePriceRaw = row[keys[3]] || '0.50';
              ratingRaw = row[keys[4]] || '8';
            }
          }

          const basePrice = parseFloat(basePriceRaw);
          const rating = parseInt(ratingRaw);

          let role: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper' = 'Batsman';
          const normalizedRole = roleRaw.toLowerCase().replace(/[^a-z]/g, '');
          if (normalizedRole === 'batsman' || normalizedRole === 'bat') role = 'Batsman';
          else if (normalizedRole === 'bowler' || normalizedRole === 'bowl') role = 'Bowler';
          else if (normalizedRole === 'allrounder' || normalizedRole === 'all') role = 'All-Rounder';
          else if (normalizedRole === 'wicketkeeper' || normalizedRole === 'wk' || normalizedRole === 'keeper') role = 'Wicket-Keeper';

          let country: 'Indian' | 'Overseas' = 'Indian';
          const normalizedCountry = countryRaw.toLowerCase();
          if (normalizedCountry === 'overseas' || normalizedCountry === 'foreign' || normalizedCountry === 'intl' || normalizedCountry === 'international') country = 'Overseas';

          if (name && name.toLowerCase() !== 'name') {
            parsedPlayers.push({
              id: 'p_csv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              name,
              role,
              country,
              basePrice: isNaN(basePrice) ? 0.50 : basePrice,
              rating: isNaN(rating) ? 8 : rating,
              status: 'Unsold'
            });
          }
        });

        if (parsedPlayers.length === 0) {
          showNotification('Ensure spreadsheet contains valid entries with Name, Role, Nationality, and Base Price columns!', 'alert');
          return;
        }

        const nextP = [...players, ...parsedPlayers];
        setPlayers(nextP);
        onStateUpdate(nextP);

        showNotification(`Successfully processed CSV! Registered ${parsedPlayers.length} matches into the player draft.`, 'success');
        dispatchGatewayAlert('SMS', `📁 [Bulk CSV File Upload] Processed spreadsheet upload via PapaParse. Appended ${parsedPlayers.length} unassigned players.`);
      },
      error: (err) => {
        showNotification('PapaParse file reader failed: ' + err.message, 'alert');
      }
    });
  };

  const handleBulkParse = () => {
    try {
      const rows = csvBulkText.split('\n');
      const parsedPlayers: Player[] = [];
      
      rows.forEach((row) => {
        if (!row.trim()) return;
        const columns = row.split(',');
        if (columns.length >= 2) {
          const name = columns[0].trim();
          const role = (columns[1] || 'Batsman').trim();
          const country = (columns[2] || 'Indian').trim();
          const basePrice = parseFloat(columns[3] || '0.50');
          const rating = parseInt(columns[4] || '8');

          if (name) {
            parsedPlayers.push({
              id: 'p_csv_' + Math.random().toString(36).substr(2, 6),
              name,
              role: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'].includes(role) ? role as any : 'Batsman',
              country: ['Indian', 'Overseas'].includes(country) ? country as any : 'Indian',
              basePrice: isNaN(basePrice) ? 0.50 : basePrice,
              rating: isNaN(rating) ? 8 : rating,
              status: 'Unsold'
            });
          }
        }
      });

      if (parsedPlayers.length === 0) {
        showNotification('Ensure rows contain comma limits (e.g. Virat Kohli, Batsman, Indian, 2.0)!', 'alert');
        return;
      }

      const nextP = [...players, ...parsedPlayers];
      setPlayers(nextP);
      onStateUpdate(nextP);

      showNotification(`Registered ${parsedPlayers.length} candidates in bulk database successfully!`, 'success');
      dispatchGatewayAlert('SMS', `📁 [Bulk CSV Import] Processed spreadsheet upload. Appended ${parsedPlayers.length} unassigned players to nomination list.`);
    } catch (err) {
      showNotification('Excel importer parse error.', 'alert');
    }
  };

  const loadBulkTemplate = (type: 'elite' | 'young') => {
    if (type === 'elite') {
      setCsvBulkText(
        "K.L. Rahul, Wicket-Keeper, Indian, 1.5, 9\nMitchell Marsh, All-Rounder, Overseas, 1.5, 9\nSuryakumar Yadav, Batsman, Indian, 1.5, 9\nLungi Ngidi, Bowler, Overseas, 1.0, 8\nShubman Gill, Batsman, Indian, 1.0, 9"
      );
    } else {
      setCsvBulkText(
        "Mayank Yadav, Bowler, Indian, 0.20, 8\nAbishek Porel, Wicket-Keeper, Indian, 0.20, 7\nRamandeep Singh, All-Rounder, Indian, 0.20, 7\nCameron Green, All-Rounder, Overseas, 1.00, 8"
      );
    }
    showNotification('Template rows loaded!', 'info');
  };

  const applyCategoryTiers = (rating: number, basePrice: number) => {
    const updated = players.map(p => {
      if (p.status === 'Unsold') {
        const ratingMatch = p.rating >= rating;
        return {
          ...p,
          basePrice: ratingMatch ? basePrice : p.basePrice
        };
      }
      return p;
    });

    setPlayers(updated);
    onStateUpdate(updated);
    showNotification(`Assigned ₹${basePrice} Cr base price tier to players with rating >= ${rating}!`, 'success');
    dispatchGatewayAlert('Email', `📑 [Base Setup Pricing] Recalibrated base tiers. Configured rating threshold tier of Star ${rating}+ at ₹${basePrice} Cr.`);
  };

  // Simulated portal URL coordinates
  const portalUrl = `${window.location.origin}/#/register/5f8083ba-9629-45f6-af94`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full overflow-y-auto max-h-[calc(100vh-140px)] pr-2 pb-6">
      
      {/* COLUMN 1: FORM SELECTION MATRIX */}
      <div className="lg:col-span-3 bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#f59e0b]">Registration Method</h3>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { id: 'form', label: 'Candidate Portal', desc: 'Private self-registration simulator' },
              { id: 'csv', label: 'Spreadsheet Upload', desc: 'Bulk comma parsing importer' },
              { id: 'tier', label: 'Tiers Base Prices', desc: 'Batch price setting utility' }
            ].map((bt) => (
              <button
                key={bt.id}
                onClick={() => setActiveImportTab(bt.id as any)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  activeImportTab === bt.id
                    ? 'bg-amber-500/10 border-amber-500 text-white'
                    : 'bg-slate-950/60 border-slate-850 hover:border-slate-800 text-slate-400'
                }`}
              >
                <span className="font-black uppercase tracking-wider block text-[10px] text-white">{bt.label}</span>
                <span className="text-[8px] text-slate-500 leading-none mt-0.5 block">{bt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Public Copiable Link Widget */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850/65 space-y-2 mt-4 text-[9px]">
          <span className="font-black text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Link size={10} className="text-[#f59e0b]" /> Private Self-Registration URL
          </span>
          <p className="text-slate-500 leading-normal">
            Distribute GPL self-registration links to coaches and local club players to enroll securely.
          </p>
          <div className="flex gap-1">
            <input 
              type="text" 
              readOnly 
              value={portalUrl}
              className="bg-slate-900 border border-slate-800 text-white text-[8px] px-2 py-1 rounded w-full outline-none select-all"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(portalUrl);
                showNotification('Registration portal URL copiable!', 'success');
              }}
              className="p-1 px-1.5 bg-slate-850 rounded text-slate-350 hover:text-white border-none cursor-pointer"
            >
              <Clipboard size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* COLUMN 2: ACTIVE WORKSPACE PANEL */}
      <div className="lg:col-span-9 bg-slate-900/60 border border-slate-850 rounded-2xl p-5">
        
        {/* TAB 1: FORM REGISTER */}
        {activeImportTab === 'form' && (
          <div className="space-y-4">
            <div className="pb-2 border-b border-slate-800">
              <span className="text-xs font-black uppercase text-[#f59e0b]">Self-Registration Entry Portal Sandbox</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Player Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Yashasvi Jaiswal"
                  value={selfRegName}
                  onChange={(e) => setSelfRegName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-bold text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Star Quality Rating</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={selfRegRating}
                    onChange={(e) => setSelfRegRating(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="font-mono font-black text-amber-500 w-6 text-right flex items-center justify-end gap-0.5">
                    {selfRegRating} <Star size={9} className="fill-amber-500" />
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Specialist Role Specialty</label>
                <select
                  value={selfRegRole}
                  onChange={(e: any) => setSelfRegRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-bold text-white outline-none"
                >
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Wicket-Keeper">Wicket-Keeper</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Nationality Classification</label>
                <select
                  value={selfRegCountry}
                  onChange={(e: any) => setSelfRegCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-bold text-white outline-none"
                >
                  <option value="Indian">Indian (Local)</option>
                  <option value="Overseas">Overseas (African / Aussie / Kiwi)</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Base Minimum Price (₹ Crores)</label>
                <input 
                  type="number" 
                  step="0.05"
                  value={selfRegBasePrice}
                  onChange={(e) => setSelfRegBasePrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-bold font-mono text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Sticker Face Icon</label>
                <div className="flex gap-2">
                  {['🏏', '🔥', '⚡', '🌟', '🧢', '🕶️'].map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelfRegAvatar(av)}
                      className={`w-9 h-9 text-base bg-slate-950 border rounded-lg hover:bg-slate-900 border-none cursor-pointer flex items-center justify-center ${
                        selfRegAvatar === av ? 'ring-2 ring-amber-500' : ''
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex items-center gap-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  id="localSelfRegIsMarquee"
                  checked={localSelfRegIsMarquee}
                  onChange={(e) => setLocalSelfRegIsMarquee(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-550 border-slate-800 focus:ring-amber-500 bg-slate-950"
                />
                <label htmlFor="localSelfRegIsMarquee" className="text-[10px] font-black uppercase text-slate-300 cursor-pointer select-none">
                  🌟 Designate as Marquee Player (Special High-Profile List)
                </label>
              </div>
            </div>

            <button
              onClick={handleSelfRegister}
              className="px-6 py-2.5 bg-amber-550 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
            >
              <Plus size={14} /> Register Portal Player
            </button>
          </div>
        )}

        {/* TAB 2: EXCEL BULK PARSER */}
        {activeImportTab === 'csv' && (
          <div className="space-y-4">
            <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase text-[#f59e0b] block">Spreadsheet CSV Bulk Roster Parser</span>
                <span className="text-[8.5px] text-slate-505 uppercase block mt-0.5">Dual Mode Uploader Client (Excel files or raw text rows)</span>
              </div>
              <div className="flex gap-1.5 text-[8px] font-black">
                <button 
                  onClick={() => loadBulkTemplate('elite')} 
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-850 rounded border border-slate-800 text-slate-300 cursor-pointer"
                >
                  Elite Roster Draft Template
                </button>
                <button 
                  onClick={() => loadBulkTemplate('young')} 
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-850 rounded border border-slate-800 text-slate-300 cursor-pointer"
                >
                  Young Challengers Template
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Interactive Drag and Drop File Input */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-dashed border-slate-805 hover:border-emerald-500/50 hover:bg-slate-950 transition-all flex flex-col items-center justify-center text-center space-y-3 relative group min-h-[140px]">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleCsvFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Upload size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-200 block">Upload CSV spreadsheet file</span>
                  <span className="text-[8px] text-slate-500 uppercase mt-0.5 block">Select or drop raw .CSV roster file</span>
                </div>
                <div className="text-[7.5px] font-mono text-emerald-500 font-bold uppercase tracking-wide">
                  PapaParse auto-aligns column fields!
                </div>
              </div>

              {/* Option B: Copy Paste Text Area */}
              <div className="flex flex-col space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Or copy-paste raw comma rows:</label>
                <textarea
                  rows={4}
                  value={csvBulkText}
                  onChange={(e) => setCsvBulkText(e.target.value)}
                  placeholder="e.g. Virat Kohli, Batsman, Indian, 2.0, 10"
                  className="w-full bg-slate-950 text-white font-mono text-[10.5px] p-2.5 rounded-lg border border-slate-800 outline-none focus:border-amber-500 custom-scrollbar leading-relaxed h-[105px]"
                />
                <button
                  onClick={handleBulkParse}
                  className="w-full py-2 bg-emerald-550/10 hover:bg-emerald-550 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-slate-950 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Upload size={12} /> Parse Paste Text Pool
                </button>
              </div>
            </div>

            <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wide border-t border-slate-800/40 pt-2 leading-normal">
              Supported columns: <span className="text-amber-500 font-mono">name, role, nationality, base price, rating</span>. Role matches Batsman / Bowler / All-Rounder / Wicket-Keeper. Nationality matches Indian / Overseas. Base price defaults to 0.50 Crores.
            </p>
          </div>
        )}

        {/* TAB 3: CATEGORY DEALS CONFIG */}
        {activeImportTab === 'tier' && (
          <div className="space-y-4 text-xs">
            <div className="pb-2 border-b border-slate-800">
              <span className="text-xs font-black uppercase text-[#f59e0b]">Batch Core Tiers Base Price Recalibrator</span>
            </div>

            <p className="text-[9px] text-slate-500 uppercase font-semiboldリード">
              Quickly scale preloaded or newly uploaded player base values in wholesale tiers to maintain league parity constraints.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {[
                { label: 'Elite Tier Set (Scale ratings 9-10 to ₹2.00 Crore)', rating: 9, price: 2.0 },
                { label: 'Premium Tier Set (Scale ratings 8-10 to ₹1.50 Crore)', rating: 8, price: 1.5 },
                { label: 'Major Tier Set (Scale ratings 7-10 to ₹1.00 Crore)', rating: 7, price: 1.0 },
                { label: 'Associate Tier Set (Scale ratings 6-10 to ₹0.20 Crore)', rating: 6, price: 0.2 }
              ].map((tier, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-850 hover:border-slate-800 transition-all flex flex-col justify-between items-start gap-2">
                  <span className="font-extrabold uppercase text-[9px] text-slate-350">{tier.label}</span>
                  <button
                    onClick={() => applyCategoryTiers(tier.rating, tier.price)}
                    className="px-3 py-1.5 bg-[#f59e0b]/10 text-[#f59e0b] border border-none hover:bg-[#f59e0b]/20 font-black rounded text-[9px] uppercase tracking-wider cursor-pointer transition-all self-end"
                  >
                    Execute Price Override
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* DIRECT PLAYER REGISTRY LEDGER TABLE */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 mt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-black uppercase text-[#f59e0b] block flex items-center gap-1.5">
              <Grid size={13} className="text-amber-500" /> Complete Candidate Registry (Total: {players.length} Players)
            </span>
            <span className="text-[8.5px] text-slate-500 mt-1 uppercase block leading-normal font-bold">Manage and prune incorrect roster profiles before active nominations</span>
          </div>

          {/* Search box within registry */}
          <input 
            type="text" 
            placeholder="Search candidate..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs px-3 py-1.5 rounded-lg text-white outline-none focus:border-amber-500 w-full sm:w-48 font-bold text-slate-200"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20 max-h-[300px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-500 text-[8.5px] uppercase font-black tracking-wider border-b border-slate-900 sticky top-0 z-10 backdrop-blur-md">
                <th className="p-2.5">Candidate Name</th>
                <th className="p-2.5">Playing Specialty</th>
                <th className="p-2.5">Nationality</th>
                <th className="p-2.5 font-mono">Base Price</th>
                <th className="p-2.5 text-center">Rating</th>
                <th className="p-2.5 text-center">Marquee</th>
                <th className="p-2.5 text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 font-medium text-slate-300">
              {filteredCandidates.map((p) => (
                <tr key={p.id} className="hover:bg-slate-905/40 transition-colors">
                  <td className="p-2.5 font-extrabold text-white uppercase">{p.name}</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 bg-slate-900 rounded text-slate-400 uppercase text-[7.5px] font-black border border-slate-850">
                      {p.role}
                    </span>
                  </td>
                  <td className="p-2.5 uppercase text-[9px] font-black text-slate-400">
                    {p.country === 'Indian' ? '🇮🇳 Indian' : '🌍 Overseas'}
                  </td>
                  <td className="p-2.5 font-mono text-amber-500 font-bold">{formatPrice(p.basePrice)} Cr</td>
                  <td className="p-2.5 text-center text-amber-400 font-black">★ {p.rating}</td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => {
                        const updated = players.map(py => py.id === p.id ? { ...py, isMarquee: !py.isMarquee } : py);
                        setPlayers(updated);
                        onStateUpdate(updated);
                        showNotification(`${p.name} updated marquee status!`, 'success');
                      }}
                      className="p-1 text-amber-400 hover:text-amber-300 bg-transparent border-none cursor-pointer inline-flex items-center justify-center"
                      title={p.isMarquee ? "Click to remove Marquee status" : "Click to mark as Marquee high-profile"}
                    >
                      <Star size={13} className={p.isMarquee ? "fill-amber-400 stroke-amber-400" : "stroke-slate-600 fill-none"} />
                    </button>
                  </td>
                  <td className="p-2.5 text-right pr-4">
                    <button
                      onClick={() => handleDeleteCandidate(p.id, p.name)}
                      className="p-1 px-2 bg-rose-950/20 hover:bg-rose-900/30 text-rose-455 hover:text-rose-400 border border-rose-500/10 rounded-lg cursor-pointer transition-all inline-flex items-center justify-center border-none"
                      title="Permanently Expel Player"
                    >
                      <Trash2 size={11} className="stroke-[2.5px]" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 uppercase font-black text-[9px]">
                    No search results for selected filter parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
