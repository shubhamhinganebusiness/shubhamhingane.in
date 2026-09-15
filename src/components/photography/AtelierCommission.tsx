import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Receipt, Sparkles, Calendar, MapPin, Mail, Phone } from 'lucide-react';
import { useAtelierTheme } from './AtelierTheme';

interface AtelierCommissionProps {
  scrollToSection: (e: React.MouseEvent, id: string) => void;
}

export const AtelierCommission: React.FC<AtelierCommissionProps> = ({ scrollToSection }) => {
  const { palette } = useAtelierTheme();
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingService, setBookingService] = useState('wedding');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingVenue, setBookingVenue] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [isBooked, setIsBooked] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooked(true);
    setTimeout(() => {
      setIsBooked(false);
      setBookingName('');
      setBookingEmail('');
      setBookingDate('');
      setBookingVenue('');
      setBookingMessage('');
    }, 4500);
  };

  return (
    <section 
      id="reserve" 
      style={{
        backgroundColor: palette.canvasBg,
        borderColor: palette.borderSubtle
      }}
      className="py-24 border-b relative transition-colors duration-400"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Atelier Manifesto & Information (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div 
                style={{ color: palette.accent }}
                className="inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.35em] mb-3"
              >
                <Sparkles size={11} />
                <span>COMMISSION ATELIER</span>
              </div>
              <h2 
                style={{ color: palette.textPrimary }}
                className="font-cormorant text-3xl md:text-5xl font-light tracking-tight leading-tight"
              >
                Initiate Your Commission
              </h2>
              <p 
                style={{ color: palette.textSecondary }}
                className="text-xs md:text-sm mt-4 leading-relaxed font-light"
              >
                To maintain our unyielding commitment to art direction and personal involvement, our studio accepts a limited calendar of 24 weddings each calendar year.
              </p>
            </div>

            {/* Atelier Details */}
            <div 
              style={{ borderColor: palette.borderSubtle }}
              className="space-y-4 pt-4 border-t"
            >
              <div className="flex items-start gap-3 text-xs">
                <MapPin size={15} style={{ color: palette.accent }} className="shrink-0 mt-0.5" />
                <div>
                  <strong style={{ color: palette.textPrimary }} className="block">Primary Studios:</strong>
                  <span style={{ color: palette.textSecondary }}>Udaipur • Mumbai • Lake Como • Dubai</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <Calendar size={15} style={{ color: palette.accent }} className="shrink-0 mt-0.5" />
                <div>
                  <strong style={{ color: palette.textPrimary }} className="block">Commission Response:</strong>
                  <span style={{ color: palette.textSecondary }}>Personal reply from lead artist within 24 hours.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <Receipt size={15} style={{ color: palette.accent }} className="shrink-0 mt-0.5" />
                <div>
                  <strong style={{ color: palette.textPrimary }} className="block">Verified Billing:</strong>
                  <span style={{ color: palette.textSecondary }}>All retainers secured via legal agreements and verified GST invoices.</span>
                </div>
              </div>
            </div>

            {/* Direct Studio Invoicing link */}
            <div className="pt-2">
              <a
                href="#billing"
                onClick={(e) => scrollToSection(e, 'billing')}
                style={{ color: palette.accent }}
                className="inline-flex items-center gap-2 text-xs font-semibold hover:opacity-85 transition-colors uppercase tracking-wider"
              >
                <span>Launch Studio Invoicing & Milestone Suite</span>
                <span className="text-base">→</span>
              </a>
            </div>
          </div>

          {/* Right Column: Commission Form (7 cols) */}
          <div 
            style={{
              backgroundColor: palette.cardBg,
              borderColor: palette.borderCard
            }}
            className="lg:col-span-7 p-8 md:p-10 rounded-2xl border shadow-2xl relative overflow-hidden"
          >
            
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label 
                    style={{ color: palette.accent }}
                    className="text-[9.5px] font-semibold uppercase tracking-[0.2em] block mb-2"
                  >
                    Client Full Name
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Radhika Merchant"
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    style={{
                      backgroundColor: palette.isLight ? '#FFFFFF' : palette.canvasBg,
                      borderColor: palette.borderSubtle,
                      color: palette.textPrimary
                    }}
                    className="w-full rounded-lg px-4 py-3 text-xs focus:outline-none transition-colors border"
                  />
                </div>

                <div>
                  <label 
                    style={{ color: palette.accent }}
                    className="text-[9.5px] font-semibold uppercase tracking-[0.2em] block mb-2"
                  >
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="client@luxurywedding.com"
                    value={bookingEmail}
                    onChange={(e) => setBookingEmail(e.target.value)}
                    style={{
                      backgroundColor: palette.isLight ? '#FFFFFF' : palette.canvasBg,
                      borderColor: palette.borderSubtle,
                      color: palette.textPrimary
                    }}
                    className="w-full rounded-lg px-4 py-3 text-xs focus:outline-none transition-colors border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label 
                    style={{ color: palette.accent }}
                    className="text-[9.5px] font-semibold uppercase tracking-[0.2em] block mb-2"
                  >
                    Commission Discipline
                  </label>
                  <select 
                    value={bookingService} 
                    onChange={(e) => setBookingService(e.target.value)}
                    style={{
                      backgroundColor: palette.isLight ? '#FFFFFF' : palette.canvasBg,
                      borderColor: palette.borderSubtle,
                      color: palette.textPrimary
                    }}
                    className="w-full rounded-lg px-4 py-3 text-xs focus:outline-none transition-colors cursor-pointer border"
                  >
                    <option value="wedding">Destination Wedding Masterworks</option>
                    <option value="pre-wedding">Cinematic Pre-Wedding Chronicle</option>
                    <option value="editing">Atelier Color Grading & LUTs</option>
                    <option value="reels">High-Fashion Cinema & Social Reels</option>
                  </select>
                </div>

                <div>
                  <label 
                    style={{ color: palette.accent }}
                    className="text-[9.5px] font-semibold uppercase tracking-[0.2em] block mb-2"
                  >
                    Event Date & Destination
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Nov 2026, Lake Como"
                    value={bookingVenue}
                    onChange={(e) => setBookingVenue(e.target.value)}
                    style={{
                      backgroundColor: palette.isLight ? '#FFFFFF' : palette.canvasBg,
                      borderColor: palette.borderSubtle,
                      color: palette.textPrimary
                    }}
                    className="w-full rounded-lg px-4 py-3 text-xs focus:outline-none transition-colors border"
                  />
                </div>
              </div>

              <div>
                <label 
                  style={{ color: palette.accent }}
                  className="text-[9.5px] font-semibold uppercase tracking-[0.2em] block mb-2"
                >
                  Event Scope & Vision
                </label>
                <textarea 
                  rows={4}
                  placeholder="Share details regarding wedding venues, anticipated traditions, aesthetic preferences, or custom requirements..."
                  value={bookingMessage}
                  onChange={(e) => setBookingMessage(e.target.value)}
                  style={{
                    backgroundColor: palette.isLight ? '#FFFFFF' : palette.canvasBg,
                    borderColor: palette.borderSubtle,
                    color: palette.textPrimary
                  }}
                  className="w-full rounded-lg px-4 py-3 text-xs focus:outline-none transition-colors border"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  style={{
                    backgroundColor: palette.accent,
                    color: palette.accentContrastText
                  }}
                  className="w-full py-4 font-bold uppercase tracking-[0.2em] text-[10px] rounded-lg transition-all duration-300 shadow-xl cursor-pointer hover:opacity-90"
                >
                  Transmit Commission Inquiry
                </button>
              </div>
            </form>

            {/* Success Overlay */}
            <AnimatePresence>
              {isBooked && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    backgroundColor: palette.cardBg
                  }}
                  className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 text-center z-30"
                >
                  <CheckCircle2 size={48} style={{ color: palette.accent }} className="mb-4" />
                  <h3 
                    style={{ color: palette.textPrimary }}
                    className="font-cormorant text-2xl md:text-3xl font-light mb-2"
                  >
                    Commission Received
                  </h3>
                  <p 
                    style={{ color: palette.textSecondary }}
                    className="text-xs max-w-sm leading-relaxed"
                  >
                    Thank you. Our creative director will review your event dates against studio availability and contact you within 24 hours.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>
    </section>
  );
};
