import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2, ShieldAlert, Radio } from 'lucide-react';

interface GatewayLogEntry {
  id: string;
  service: 'WhatsApp' | 'SMS' | 'Email';
  text: string;
  status: 'Simulated' | 'Dispatched';
  time: string;
}

interface NotificationsModuleProps {
  gatewayLogs: GatewayLogEntry[];
  setGatewayLogs: (val: GatewayLogEntry[]) => void;
  showNotification: (text: string, type?: 'success' | 'alert' | 'info') => void;
}

export const NotificationsModule: React.FC<NotificationsModuleProps> = ({
  gatewayLogs,
  setGatewayLogs,
  showNotification
}) => {
  const [filterService, setFilterService] = useState<'all' | 'WhatsApp' | 'SMS' | 'Email'>('all');
  const [customMsg, setCustomMsg] = useState<string>('');
  const [targetService, setTargetService] = useState<'WhatsApp' | 'SMS' | 'Email'>('WhatsApp');

  const filteredLogs = gatewayLogs.filter(log => filterService === 'all' || log.service === filterService);

  const testTriggerAlert = () => {
    if (!customMsg.trim()) {
      showNotification('Input custom text message content!', 'alert');
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const insertedLog: GatewayLogEntry = {
      id: 'log_' + Date.now(),
      service: targetService,
      text: `📣 [Custom Dispatch] -> ${customMsg.trim()}`,
      status: 'Dispatched' as const,
      time: timeStr
    };

    setGatewayLogs([insertedLog, ...gatewayLogs]);
    setCustomMsg('');
    showNotification(`Custom broadcast alerted via ${targetService} channel!`, 'success');
  };

  const clearGatewayLogs = () => {
    if (window.confirm('Clear all simulated alert logs?')) {
      setGatewayLogs([]);
      showNotification('Alert registry emptied.', 'info');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full overflow-y-auto max-h-[calc(100vh-140px)] pr-2 pb-6">
      
      {/* COLUMN 1: MANUAL BROADCAST DISPATCHER (4 Cols) */}
      <div className="lg:col-span-4 bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-center gap-2">
            <MessageSquare size={15} className="text-[#f59e0b]" />
            <h3 className="text-xs font-black uppercase tracking-widest text-[#f59e0b]">Communications Outbox Panel</h3>
          </div>

          <p className="text-[9px] text-slate-400 uppercase leading-relaxed font-semibold">
            GullyScore features bidirectional simulated integrations with Green WhatsApp Alerts API, SMS Networks, and SMTP mail structures to notify team managers automatically when a bid is drafted or settled.
          </p>

          <div className="space-y-3 pt-2 text-xs">
            <div>
              <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Target Channel</label>
              <select
                value={targetService}
                onChange={(e: any) => setTargetService(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-[10px] font-bold text-white outline-none uppercase"
              >
                <option value="WhatsApp">🟢 WhatsApp Alert API</option>
                <option value="SMS">📲 SMS Cell Operator gateway</option>
                <option value="Email">📧 SMTP Official Email service</option>
              </select>
            </div>

            <div>
              <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Custom Alert Text</label>
              <textarea
                rows={3}
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="e.g. Schedule meeting for draft roster check inside Table 4."
                className="w-full bg-slate-950 text-white font-sans text-xs p-2.5 rounded-lg border border-slate-800 outline-none focus:border-amber-500 leading-normal"
              />
            </div>
          </div>
        </div>

        <button
          onClick={testTriggerAlert}
          className="w-full py-2.5 bg-amber-550 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10 mt-4"
        >
          <Send size={12} /> Dispatch Custom Broadcast Alert
        </button>
      </div>

      {/* COLUMN 2: REALTIME AUDIT TELEMETRY STREAM (8 Cols) */}
      <div className="lg:col-span-8 bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Header Row */}
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Radio size={14} className="text-emerald-400 animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-widest text-[#f59e0b]">Simulated Dispatch Logs</h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter controls */}
              <div className="flex bg-slate-950 rounded-lg border border-slate-850 p-0.5">
                {['all', 'WhatsApp', 'SMS', 'Email'].map((srv) => (
                  <button
                    key={srv}
                    onClick={() => setFilterService(srv as any)}
                    className={`px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded-md border-none cursor-pointer transition-all ${
                      filterService === srv
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 bg-transparent hover:text-white'
                    }`}
                  >
                    {srv}
                  </button>
                ))}
              </div>

              <button
                onClick={clearGatewayLogs}
                className="px-2 py-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[8px] font-black text-rose-455 rounded uppercase cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* TELEMETRY LIST LOG */}
          <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2.5 custom-scrollbar">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-3 bg-slate-950/75 border border-slate-850/60 rounded-xl hover:border-slate-800 transition-all flex items-start gap-2.5"
              >
                {/* Visual Label */}
                <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest flex items-center justify-center border ${
                  log.service === 'WhatsApp'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : log.service === 'SMS'
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {log.service}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-200 leading-normal font-medium">{log.text}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[8px] font-extrabold uppercase text-slate-500">
                    <CheckCircle2 size={10} className="text-emerald-400" />
                    <span>Trigger Dispatched Successfully • {log.time}</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="py-20 text-center text-slate-500 text-[9px] uppercase font-bold">
                No simulated alerts matching the service filter.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
