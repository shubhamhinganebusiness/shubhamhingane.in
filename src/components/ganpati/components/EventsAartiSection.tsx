import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  Flame, 
  Sparkles, 
  MapPin, 
  Ticket, 
  Share2, 
  Bell, 
  CheckCircle2, 
  User, 
  ShieldCheck,
  Plus
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AartiSchedule, MandalEvent, MandalProfile, MandalLanguage } from '../types';
import { mandalTranslations } from '../translations/mandalTranslations';

interface EventsAartiSectionProps {
  aartis: AartiSchedule[];
  events: MandalEvent[];
  mandal: MandalProfile;
  lang: MandalLanguage;
  userRole: string;
}

export const EventsAartiSection: React.FC<EventsAartiSectionProps> = ({
  aartis,
  events,
  mandal,
  lang,
  userRole
}) => {
  const t = mandalTranslations[lang];
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [passData, setPassData] = useState({
    name: '',
    phone: '',
    persons: '2',
    date: '2026-08-17',
    timeSlot: '07:00 PM - 08:30 PM (महाआरती वेळ)',
    passType: 'Senior Citizen & Family (ज्येष्ठ नागरिक व परिवार)'
  });
  const [generatedPass, setGeneratedPass] = useState<any | null>(null);

  const handleGeneratePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passData.name || !passData.phone) return;

    const passNum = `VIP-${Math.floor(100000 + Math.random() * 900000)}`;
    setGeneratedPass({
      passNumber: passNum,
      ...passData,
      timestamp: new Date().toLocaleString()
    });
  };

  return (
    <div className="space-y-8">
      
      {/* Next Upcoming Aarti Spotlight */}
      <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 text-white p-6 md:p-8 shadow-xl border border-amber-400/30">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          <div className="md:col-span-8 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Flame size={14} className="text-amber-300 animate-pulse" />
                पुढील आगामी महाआरती • Live Aarti Alert
              </span>
            </div>

            <h3 className="text-2xl md:text-4xl font-black tracking-tight">
              सायंकालीन महाआरती (Evening Maha Aarti)
            </h3>
            <p className="text-sm text-amber-100 font-serif">
              दररोज सायंकाळी ७:३० वाजता • १००८ दिव्यांची भव्य महाआरती व धूप आरती
            </p>
          </div>

          <div className="md:col-span-4 flex flex-col items-center md:items-end justify-center">
            <div className="p-4 bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 text-center space-y-1 w-full max-w-xs">
              <span className="text-[10px] uppercase font-bold text-amber-200 block">आरती वेळ</span>
              <div className="text-2xl font-black font-mono">०७:३० PM</div>
              <span className="text-[10px] text-white/80 block">मुख्य गाभारा, पुणे</span>
            </div>
          </div>

        </div>
      </div>

      {/* Daily Aarti Schedule Grid */}
      <div className="bg-surface p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
        <div>
          <h3 className="text-xl font-black text-main-text tracking-tight flex items-center gap-2">
            <Flame className="text-primary" size={22} />
            {t.events.dailyAartiTitle}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            श्रींच्या नित्य सेवेची नियमित दैनिक आरती व नैवेद्य वेळापत्रक.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {aartis.map((aarti) => (
            <div 
              key={aarti.id}
              className="p-5 bg-gradient-to-br from-amber-500/5 to-transparent rounded-3xl border border-amber-200/60 dark:border-amber-900/40 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <span className="p-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl">
                  <Clock size={16} />
                </span>
                <span className="text-sm font-black font-mono text-primary bg-primary/10 px-2.5 py-1 rounded-xl">
                  {aarti.time}
                </span>
              </div>

              <div>
                <h4 className="text-base font-black text-main-text">
                  {lang === 'mr' ? aarti.nameMr : aarti.nameEn}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'mr' ? aarti.descriptionMr : aarti.descriptionEn}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                आरती प्रमुख: {aarti.priest}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 10 Days Festival Events & VIP Pass CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Events Timeline */}
        <div className="lg:col-span-8 bg-surface p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-main-text tracking-tight flex items-center gap-2">
                <Calendar className="text-primary" size={22} />
                {t.events.upcomingFestivals}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                १० दिवसांचे भव्य धार्मिक, सामाजिक व सांस्कृतिक कार्यक्रम.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {events.map((event) => (
              <div 
                key={event.id}
                className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg uppercase">
                      {event.time}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{event.date}</span>
                  </div>

                  <h4 className="text-base font-bold text-main-text">
                    {lang === 'mr' ? event.titleMr : event.titleEn}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {lang === 'mr' ? event.descriptionMr : event.descriptionEn}
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:self-center">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={13} className="text-primary" /> {event.location}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VIP / Senior Citizen Darshan Pass Box */}
        <div className="lg:col-span-4 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-6 rounded-[2.5rem] border-2 border-amber-500/30 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="p-3 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-2xl w-fit">
              <Ticket size={24} />
            </div>

            <h3 className="text-xl font-black text-main-text">
              ई-दर्शन व विशेष पास (E-Darshan Pass)
            </h3>

            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              ज्येष्ठ नागरिक, दिव्यांग भाविक व विशेष देणगीदारांसाठी रांगेत न थांबता जलद दर्शनासाठी मोफत डिजिटल पास मिळवा.
            </p>

            <ul className="text-xs space-y-1.5 text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={13} className="text-emerald-500" /> थेट विशेष प्रवेशद्वार दर्शन
              </li>
              <li className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={13} className="text-emerald-500" /> स्कॅन कोडद्वारे तात्काळ प्रवेश
              </li>
              <li className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={13} className="text-emerald-500" /> महाप्रसाद पाकीट अग्रक्रम
              </li>
            </ul>
          </div>

          <button 
            onClick={() => setIsPassModalOpen(true)}
            className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-orange-900/20 transition-all flex items-center justify-center gap-2"
          >
            <Ticket size={16} />
            डिजिटल ई-पास मिळवा (Get Free Pass)
          </button>
        </div>

      </div>

      {/* E-Pass Modal */}
      <AnimatePresence>
        {isPassModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-2xl border border-amber-200 dark:border-zinc-800 relative my-8"
            >
              {!generatedPass ? (
                <div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-zinc-800 mb-4">
                    <h3 className="text-base font-black text-main-text">ई-दर्शन पास अर्ज</h3>
                    <button onClick={() => setIsPassModalOpen(false)} className="text-gray-400">✕</button>
                  </div>

                  <form onSubmit={handleGeneratePass} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">भाविकाचे पूर्ण नाव *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="उदा. श्री. रमेश जोशी"
                        value={passData.name}
                        onChange={e => setPassData({ ...passData, name: e.target.value })}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">मोबाईल नंबर *</label>
                        <input 
                          type="tel" 
                          required
                          placeholder="98XXXXXXXX"
                          value={passData.phone}
                          onChange={e => setPassData({ ...passData, phone: e.target.value })}
                          className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">व्यक्ती संख्या</label>
                        <input 
                          type="number" 
                          min="1"
                          max="6"
                          value={passData.persons}
                          onChange={e => setPassData({ ...passData, persons: e.target.value })}
                          className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">पास प्रकार</label>
                      <select 
                        value={passData.passType}
                        onChange={e => setPassData({ ...passData, passType: e.target.value })}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text"
                      >
                        <option value="Senior Citizen & Family (ज्येष्ठ नागरिक व परिवार)">Senior Citizen (ज्येष्ठ नागरिक)</option>
                        <option value="Divyang / Special Darshan (दिव्यांग भाविक)">Divyang (दिव्यांग)</option>
                        <option value="Aarti Devotee Pass (आरती उपस्थिती)">Aarti Devotee Pass (आरती)</option>
                      </select>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-all mt-2"
                    >
                      ई-पास तयार करा
                    </button>
                  </form>
                </div>
              ) : (
                /* Display Generated Pass */
                <div className="space-y-4 text-center">
                  <div className="p-4 bg-amber-50 dark:bg-zinc-800/80 rounded-2xl border-2 border-dashed border-amber-500 space-y-3">
                    <span className="px-3 py-1 bg-amber-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                      श्री शिवतेज मंडळ ई-दर्शन पास
                    </span>

                    <div className="font-mono text-xs font-bold text-gray-400">पास क्र: {generatedPass.passNumber}</div>
                    <h4 className="text-lg font-black text-main-text">{generatedPass.name}</h4>
                    <p className="text-xs text-gray-500">व्यक्ती: {generatedPass.persons} • {generatedPass.passType}</p>
                    
                    <div className="py-2 flex justify-center">
                      <QRCodeSVG value={JSON.stringify(generatedPass)} size={110} />
                    </div>

                    <div className="text-[10px] text-gray-500">
                      गेट क्र. २ वर हा QR कोड दाखवून प्रवेश मिळवा.
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const text = encodeURIComponent(
                          `🚩 श्री शिवतेज गणेश मंडळ ई-दर्शन पास 🚩\nपास क्र: ${generatedPass.passNumber}\nनाव: ${generatedPass.name}\nव्यक्ती: ${generatedPass.persons}\nदिनांक: ${generatedPass.date}`
                        );
                        window.open(`https://wa.me/91${generatedPass.phone}?text=${text}`, '_blank');
                      }}
                      className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Share2 size={13} /> WhatsApp वर पाठवा
                    </button>
                    <button 
                      onClick={() => {
                        setGeneratedPass(null);
                        setIsPassModalOpen(false);
                      }}
                      className="px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold"
                    >
                      पूर्ण झाले
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
