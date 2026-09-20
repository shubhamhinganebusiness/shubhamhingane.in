import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, RotateCcw, Eye, Shield, Users, CheckCircle2 } from 'lucide-react';
import { 
  FielderPosition, 
  DEFAULT_FIELD_POSITIONS, 
  FIELDING_PRESETS, 
  isFielderInsideRing, 
  BOUNDARY_RADIUS, 
  INNER_CIRCLE_RX, 
  INNER_CIRCLE_RY 
} from './FieldPositionTypes';

interface FieldPositionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPositions?: FielderPosition[];
  onSavePositions: (positions: FielderPosition[]) => void;
  onShowOnBroadcast: (positions: FielderPosition[]) => void;
  isLiveOnAir?: boolean;
  fieldingTeamName?: string;
  fieldingPlayers?: string[];
}

export const FieldPositionManagerModal: React.FC<FieldPositionManagerModalProps> = ({
  isOpen,
  onClose,
  currentPositions,
  onSavePositions,
  onShowOnBroadcast,
  isLiveOnAir = false,
  fieldingTeamName = 'FIELDING TEAM',
  fieldingPlayers = []
}) => {
  const [positions, setPositions] = useState<FielderPosition[]>(() => {
    if (currentPositions && currentPositions.length === 11) {
      return currentPositions;
    }
    return DEFAULT_FIELD_POSITIONS.map((p, idx) => ({
      ...p,
      name: fieldingPlayers[idx] || p.name
    }));
  });

  const [activeFielderId, setActiveFielderId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('Powerplay (2 Deep)');
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [showRosterDrawer, setShowRosterDrawer] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement>(null);

  // Sync when currentPositions change or modal opens
  useEffect(() => {
    if (isOpen) {
      if (currentPositions && currentPositions.length === 11) {
        setPositions(currentPositions);
      } else {
        setPositions(DEFAULT_FIELD_POSITIONS.map((p, idx) => ({
          ...p,
          name: (fieldingPlayers && fieldingPlayers[idx]) || p.name
        })));
      }
    }
  }, [isOpen, currentPositions]);

  // Update names from fieldingPlayers if available
  const fieldingPlayersKey = (fieldingPlayers || []).join('|');
  useEffect(() => {
    if (fieldingPlayers && fieldingPlayers.length > 0) {
      setPositions(prev => prev.map((p, idx) => ({
        ...p,
        name: fieldingPlayers[idx] || p.name
      })));
    }
  }, [fieldingPlayersKey]);

  const notify = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => {
      setShowNotification(null);
    }, 2800);
  };

  // Convert client pointer coordinates to SVG 0-100% coordinates
  const getFieldCoordinates = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    // Constrain inside boundary circle (radius = BOUNDARY_RADIUS % from center (50, 50))
    const dx = x - 50;
    const dy = y - 50;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = BOUNDARY_RADIUS - 1.5;

    if (dist > maxRadius) {
      x = 50 + (dx / dist) * maxRadius;
      y = 50 + (dy / dist) * maxRadius;
    }

    return {
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10
    };
  }, []);

  const handlePointerDown = (id: number, e: React.PointerEvent) => {
    e.stopPropagation();
    setActiveFielderId(id);
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || activeFielderId === null) return;
    const coords = getFieldCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    setPositions(prev =>
      prev.map(f => (f.id === activeFielderId ? { ...f, x: coords.x, y: coords.y } : f))
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  // Click anywhere on field to move currently selected fielder or activate closest
  const handleFieldClick = (e: React.MouseEvent) => {
    const coords = getFieldCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    if (activeFielderId !== null) {
      setPositions(prev =>
        prev.map(f => (f.id === activeFielderId ? { ...f, x: coords.x, y: coords.y } : f))
      );
    }
  };

  const handlePresetSelect = (presetName: string) => {
    const preset = FIELDING_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setSelectedPreset(presetName);
      const newPos = preset.getPositions().map((p, idx) => ({
        ...p,
        name: fieldingPlayers[idx] || p.name
      }));
      setPositions(newPos);
      notify(`Applied "${presetName}" setup!`);
    }
  };

  const handleReset = () => {
    const resetPos = DEFAULT_FIELD_POSITIONS.map((p, idx) => ({
      ...p,
      name: fieldingPlayers[idx] || p.name
    }));
    setPositions(resetPos);
    setSelectedPreset('Powerplay (2 Deep)');
    notify('Reset to default field positions!');
  };

  const handleUpdatePositions = () => {
    onSavePositions(positions);
    notify('Field positions saved successfully!');
  };

  const handleShowPositions = () => {
    onSavePositions(positions);
    onShowOnBroadcast(positions);
    notify('Field Position overlay is now LIVE ON AIR!');
  };

  // Count inside vs outside 30-yard ring
  const insideRingCount = positions.filter(f => isFielderInsideRing(f.x, f.y)).length;
  const outsideRingCount = positions.length - insideRingCount;

  const activeFielder = positions.find(f => f.id === activeFielderId);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[540px] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col max-h-[96vh]"
        onClick={e => e.stopPropagation()}
        id="field-position-modal-container"
      >
        {/* TOP HEADER: Dark Navy matching reference Screenshot */}
        <div className="bg-[#19275a] text-white px-5 py-3.5 flex items-center justify-between select-none shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl font-bold tracking-tight">Field Position</span>
            {isLiveOnAir && (
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse shadow">
                LIVE ON AIR
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded bg-white/10 hover:bg-white/25 text-white/90 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-base font-bold"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* NOTIFICATION TOAST */}
        {showNotification && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-emerald-400 px-4 py-1.5 rounded-full shadow-lg border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>{showNotification}</span>
          </div>
        )}

        {/* MODAL BODY (White Background matching Reference Screenshot) */}
        <div className="bg-white p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col items-center select-none">
          {/* Top Actions: "Update Positions" bordered button */}
          <div className="w-full flex items-center justify-center mb-1">
            <button
              type="button"
              onClick={handleUpdatePositions}
              className="px-5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-700 font-semibold text-sm rounded shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              Update Positions
            </button>
          </div>

          {/* Subtitle Blue Instruction matching Screenshot */}
          <p className="text-[#3b82f6] text-sm sm:text-base font-medium mb-3 text-center">
            Click or Drag dots to set field positions
          </p>

          {/* CRICKET GROUND SVG (1:1 with Reference Screenshot & Overlay) */}
          <div className="relative w-full aspect-square max-w-[380px] sm:max-w-[400px] mx-auto flex items-center justify-center">
            <svg
              ref={svgRef}
              viewBox="0 0 100 100"
              className="w-full h-full cursor-crosshair drop-shadow-md touch-none"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onClick={handleFieldClick}
            >
              <defs>
                {/* Outfield radial subtle gradient */}
                <radialGradient id="grassGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1e8e3e" />
                  <stop offset="70%" stopColor="#15803d" />
                  <stop offset="100%" stopColor="#166534" />
                </radialGradient>

                {/* Inner circle subtle glow */}
                <radialGradient id="innerCircleGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
                  <stop offset="90%" stopColor="#15803d" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </radialGradient>

                {/* Pitch surface gradient */}
                <linearGradient id="pitchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#eab308" />
                  <stop offset="45%" stopColor="#fef08a" />
                  <stop offset="55%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>

                {/* Yellow fielder dot glow */}
                <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="#facc15" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* 1. OUTFIELD CIRCLE (Green Grass) */}
              <circle
                cx="50"
                cy="50"
                r={BOUNDARY_RADIUS}
                fill="url(#grassGradient)"
              />

              {/* 2. BOUNDARY LINE (Solid Orange Ring matching Reference Screenshot) */}
              <circle
                cx="50"
                cy="50"
                r={BOUNDARY_RADIUS}
                fill="none"
                stroke="#f97316"
                strokeWidth="1.6"
              />

              {/* 3. 30-YARD INNER CIRCLE (White Oval with subtle glow) */}
              <ellipse
                cx="50"
                cy="50"
                rx={INNER_CIRCLE_RX}
                ry={INNER_CIRCLE_RY}
                fill="url(#innerCircleGlow)"
                stroke="#ffffff"
                strokeWidth="0.85"
                opacity="0.95"
              />

              {/* 4. CENTRAL PITCH RECTANGLE */}
              <rect
                x="46"
                y="43.5"
                width="8"
                height="13"
                rx="0.4"
                fill="url(#pitchGrad)"
              />

              {/* Pitch popping crease markings */}
              <line x1="45" y1="45" x2="55" y2="45" stroke="#ffffff" strokeWidth="0.3" opacity="0.8" />
              <line x1="45" y1="55" x2="55" y2="55" stroke="#ffffff" strokeWidth="0.3" opacity="0.8" />

              {/* 5. STUMPS (Red Dots at Top and Bottom of Pitch) */}
              <circle cx="50" cy="43.5" r="1.6" fill="#dc2626" />
              <circle cx="50" cy="56.5" r="1.6" fill="#dc2626" />

              {/* 6. "KEEPER" & "BOWLER" TEXT LABELS (Bold Black text matching Screenshot) */}
              <text
                x="50"
                y="38.5"
                textAnchor="middle"
                fill="#000000"
                fontSize="4"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="0.2"
                className="select-none pointer-events-none"
              >
                KEEPER
              </text>

              <text
                x="50"
                y="63.5"
                textAnchor="middle"
                fill="#000000"
                fontSize="4"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="0.2"
                className="select-none pointer-events-none"
              >
                BOWLER
              </text>

              {/* 7. 11 YELLOW DRAGGABLE FIELDER DOTS */}
              {positions.map(fielder => {
                const isInside = isFielderInsideRing(fielder.x, fielder.y);
                const isSelected = activeFielderId === fielder.id;

                return (
                  <g
                    key={fielder.id}
                    transform={`translate(${fielder.x}, ${fielder.y})`}
                    className="cursor-grab active:cursor-grabbing transition-transform duration-75"
                    onPointerDown={e => handlePointerDown(fielder.id, e)}
                  >
                    {/* Active highlight ring */}
                    {isSelected && (
                      <circle
                        cx="0"
                        cy="0"
                        r="3.8"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="0.8"
                        strokeDasharray="1.5 1.5"
                        className="animate-spin"
                        style={{ transformOrigin: '0 0' }}
                      />
                    )}

                    {/* Outer ring for boundary fielders (matching the white rings on bottom dots in screenshot) */}
                    {!isInside && (
                      <circle
                        cx="0"
                        cy="0"
                        r="2.5"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="0.9"
                      />
                    )}

                    {/* Main Yellow Fielder Dot */}
                    <circle
                      cx="0"
                      cy="0"
                      r={!isInside ? 1.8 : 2.0}
                      fill="#fde047"
                      stroke={!isInside ? 'none' : '#eab308'}
                      strokeWidth="0.3"
                      filter="url(#dotGlow)"
                    />

                    {/* Fielder Number / Initial */}
                    <text
                      cx="0"
                      cy="0"
                      x="0"
                      y="0.7"
                      textAnchor="middle"
                      fill="#1e293b"
                      fontSize="1.6"
                      fontWeight="900"
                      className="pointer-events-none select-none"
                    >
                      {fielder.jerseyNumber || fielder.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* ACTIVE FIELDER INFO CARD & PRESETS */}
          <div className="w-full mt-2 space-y-2">
            {/* Active Fielder pill */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-amber-600 shrink-0" />
                <span className="font-bold text-slate-800 truncate">
                  {activeFielder ? `#${activeFielder.id} ${activeFielder.name} (${activeFielder.roleName})` : 'Select any dot to view & adjust'}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                activeFielder
                  ? isFielderInsideRing(activeFielder.x, activeFielder.y)
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {activeFielder
                  ? isFielderInsideRing(activeFielder.x, activeFielder.y)
                    ? 'Inside 30Y Circle'
                    : 'Deep Boundary'
                  : `${insideRingCount} In / ${outsideRingCount} Out`}
              </span>
            </div>

            {/* Quick Fielding Presets Bar */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-500 font-semibold shrink-0 text-[10px] uppercase">Presets:</span>
              <div className="flex gap-1">
                {FIELDING_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePresetSelect(preset.name)}
                    className={`px-2 py-1 rounded border text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedPreset === preset.name
                        ? 'bg-[#19275a] text-white border-[#19275a]'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                    title={preset.description}
                  >
                    {preset.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2 py-1 rounded border text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-600 border-slate-300 flex items-center gap-1 cursor-pointer"
                  title="Reset to default field positions"
                >
                  <RotateCcw size={10} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Expandable 11-Player Squad Roster Drawer */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowRosterDrawer(!showRosterDrawer)}
                className="w-full px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-blue-600" />
                  <span>11 Fielding Players List ({fieldingTeamName})</span>
                </span>
                <span className="text-[10px] text-blue-600 font-semibold">
                  {showRosterDrawer ? '▲ Hide List' : '▼ Assign Names'}
                </span>
              </button>

              {showRosterDrawer && (
                <div className="p-2.5 bg-white grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                  {positions.map(f => (
                    <div
                      key={f.id}
                      onClick={() => setActiveFielderId(f.id)}
                      className={`flex items-center justify-between p-1.5 rounded border text-[11px] cursor-pointer transition-colors ${
                        activeFielderId === f.id
                          ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-4 h-4 rounded-full bg-yellow-400 text-slate-950 font-black text-[9px] flex items-center justify-center shrink-0">
                          {f.id}
                        </span>
                        <input
                          type="text"
                          value={f.name}
                          onChange={e => {
                            const newName = e.target.value;
                            setPositions(prev =>
                              prev.map(p => (p.id === f.id ? { ...p, name: newName } : p))
                            );
                          }}
                          className="bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none text-xs w-28 truncate"
                          placeholder={`Player ${f.id}`}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 shrink-0 ml-1">
                        {f.roleName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER: Dark Navy matching reference Screenshot with Green "SHOW POSITIONS" button */}
        <div className="bg-[#19275a] text-white px-5 py-3.5 flex items-center justify-between select-none shadow-inner shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-200 font-mono text-[11px]">
              Field: <strong>{insideRingCount} In Ring</strong> • <strong>{outsideRingCount} Deep</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleShowPositions}
            className="px-6 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white font-extrabold uppercase text-xs sm:text-sm tracking-wider rounded transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Eye size={16} />
            <span>SHOW POSITIONS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
