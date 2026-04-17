import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calendar, MapPin, Clock, Camera, Heart, ArrowRight, Share2, QrCode as QrCodeIcon, X, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { generateEventDetails, EventData, analyzePrompt, PromptAnalysis, generateEventImage } from './services/geminiService';

type Step = 'home' | 'analyzing' | 'wizard' | 'generating' | 'event';

export default function App() {
  const [step, setStep] = useState<Step>('home');
  const [prompt, setPrompt] = useState("");
  const [analysis, setAnalysis] = useState<PromptAnalysis | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);

  // Wizard fields
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setStep('analyzing');
    try {
      const res = await analyzePrompt(prompt);
      setAnalysis(res);
      setDate(res.extractedData.date || "");
      setTime(res.extractedData.time || "");
      setLocation(res.extractedData.location || "");

      if (res.needsMoreInfo) {
        setStep('wizard');
      } else {
        await createFinalEvent(prompt, res.extractedData.date, res.extractedData.time, res.extractedData.location);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong analyzing your prompt.");
      setStep('home');
    }
  };

  const submitWizard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !location) {
      alert("Please fill in all the details.");
      return;
    }
    await createFinalEvent(prompt, date, time, location);
  };

  const createFinalEvent = async (p: string, d: string, t: string, l: string) => {
    setStep('generating');
    try {
      const data = await generateEventDetails(p, d, t, l);
      
      const imagePromises = [
        generateEventImage(`Atmospheric hero banner, elegant event setting. Theme: ${data.themeName}. Vibe: ${data.vibe}.`, '16:9'),
        generateEventImage(`Aesthetic detail, close up, warm lighting. Theme: ${data.themeName}. Vibe: ${data.vibe}.`, '1:1'),
        generateEventImage(`Celebration, drinks, cheers, party context. Theme: ${data.themeName}.`, '3:4')
      ];

      (data.schedule || []).forEach((item) => {
        imagePromises.push(generateEventImage(`Event step: ${item.title}. Theme: ${data.themeName}. Vibe: ${data.vibe}.`, '4:3'));
      });

      const base64Images = await Promise.all(imagePromises);

      data.images = {
        hero: base64Images[0],
        details: base64Images[1],
        rsvp: base64Images[2],
        timeline: base64Images.slice(3)
      };

      setEventData(data);
      setStep('event');
    } catch (error) {
      console.error(error);
      alert("Something went wrong creating your event. Please try again.");
      setStep('home');
    }
  };

  const reset = () => {
    setEventData(null);
    setPrompt("");
    setDate("");
    setTime("");
    setLocation("");
    setStep('home');
  };

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-1000" style={{
      backgroundColor: step === 'event' && eventData ? eventData.themeColors.background : '#FDFBF7'
    }}>
      <AnimatePresence mode="wait">
        
        {step === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="min-h-screen grid grid-cols-1 lg:grid-cols-2"
          >
            {/* Left Box: Form & Copy */}
            <div className="flex flex-col justify-center p-8 lg:p-16 z-20">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#5A5A40] text-[#faf9f6] mb-8 shadow-md">
                  <Camera size={24} strokeWidth={1.5} />
                </div>
                <h1 className="font-serif text-5xl md:text-7xl font-light text-[#1a1a1a] mb-6 leading-[1.1] tracking-tight">
                  Gather together.<br />
                  <span className="italic text-[#5A5A40]">Beautifully.</span>
                </h1>
                <p className="text-lg text-gray-600 font-sans font-light mb-12 max-w-md">
                  Create a stunning, AI-designed event page in seconds. Collect memories from every guest automatically.
                </p>

                <form onSubmit={handleStart} className="w-full relative max-w-xl">
                  <div className="p-2 border border-gray-200 rounded-[32px] shadow-sm flex items-center gap-4 focus-within:border-[#5A5A40] focus-within:ring-1 focus-within:ring-[#5A5A40] transition-all duration-300 bg-white">
                    <Sparkles className="text-gray-400 shrink-0 ml-4" size={20} />
                    <input
                      type="text"
                      placeholder="e.g. My daughter's 5th birthday, princess theme..."
                      className="flex-1 bg-transparent border-none outline-none py-4 text-gray-800 placeholder:text-gray-400 font-sans text-base"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!prompt.trim()}
                      className="shrink-0 bg-[#5A5A40] text-white pill-button flex items-center gap-2 hover:bg-[#4a4a34] disabled:opacity-50 disabled:hover:transform-none shadow-md"
                    >
                      <span className="hidden sm:inline">Start</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
            
            {/* Right Box: Hero Visual */}
            <div className="hidden lg:block relative p-6 pointer-events-none">
              <div className="w-full h-full rounded-[40px] overflow-hidden relative shadow-2xl">
                 <img 
                    src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
                    alt="Elegant gathering"
                    className="absolute inset-0 w-full h-full object-cover"
                 />
                 <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent"></div>
                 <div className="absolute bottom-12 left-12 right-12">
                   <div className="glass-panel p-8 rounded-3xl text-white backdrop-blur-md border border-white/20">
                     <p className="font-serif italic text-2xl mb-2">"The best party we've ever hosted."</p>
                     <p className="font-sans text-sm font-medium tracking-wider uppercase opacity-80">Aria's 30th Birthday</p>
                   </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'analyzing' && (
          <LoadingView message="Analyzing your event details..." />
        )}

        {step === 'generating' && (
          <LoadingView message="Crafting your event page using AI (Generating custom images)..." />
        )}

        {step === 'wizard' && (
          <motion.div 
            key="wizard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="min-h-screen flex items-center justify-center p-6 bg-[#FDFBF7]"
          >
            <div className="glass-panel p-8 md:p-12 rounded-[40px] max-w-xl w-full bg-white shadow-2xl">
              <h2 className="font-serif text-4xl mb-4 text-[#1a1a1a]">Let's make it perfect.</h2>
              <p className="font-sans text-gray-600 mb-8 leading-relaxed">
                We're almost ready to generate your event page. We just need a few more details so your guests know exactly when and where to go.
              </p>

              <form onSubmit={submitWizard} className="space-y-6">
                {analysis?.missingFields.date && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest pl-2 mb-2">Event Date</label>
                    <input 
                      required
                      type="text" 
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      placeholder="e.g. Saturday, October 24th, 2026"
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all font-sans"
                    />
                  </div>
                )}

                {analysis?.missingFields.time && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest pl-2 mb-2">Start & End Time</label>
                    <input 
                      required
                      type="text" 
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      placeholder="e.g. 6:00 PM - 11:00 PM"
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all font-sans"
                    />
                  </div>
                )}

                {analysis?.missingFields.location && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest pl-2 mb-2">Location & Address</label>
                    <input 
                      required
                      type="text" 
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. The Royal Gardens, 456 Emerald Ave"
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all font-sans"
                    />
                  </div>
                )}

                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setStep('home')} className="px-6 py-4 rounded-full font-sans font-medium text-gray-500 hover:bg-gray-100 transition-colors">
                    Back
                  </button>
                  <button type="submit" className="flex-1 pill-button bg-[#5A5A40] text-white py-4 shadow-md flex justify-center items-center gap-2">
                    Create Event <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {step === 'event' && eventData && (
          <EventPageView data={eventData} onReset={reset} />
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingView({ message }: { message: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FDFBF7]"
    >
      <Loader2 className="animate-spin text-[#5A5A40] mb-6" size={48} />
      <p className="font-serif text-2xl text-[#1a1a1a] animate-pulse">{message}</p>
    </motion.div>
  );
}

function EventPageView({ data, onReset }: { data: EventData, onReset: () => void }) {
  const [rsvpState, setRsvpState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [showShareModal, setShowShareModal] = useState(false);

  const shareUrl = window.location.href + `?event=${encodeURIComponent(data.title.replace(/\s+/g, '-').toLowerCase())}`;

  const handleRSVP = (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpState('submitting');
    setTimeout(() => {
      setRsvpState('success');
    }, 1500);
  };

  const dir = data.isRTL ? "rtl" : "ltr";

  const getStyleConfig = (style: string) => {
    const trackingTight = data.isRTL ? 'tracking-normal' : 'tracking-tight';
    const trackingTighter = data.isRTL ? 'tracking-normal' : 'tracking-tighter';
    
    switch (style) {
      case 'playful':
        return {
          headingFont: `font-sans font-black ${trackingTight}`,
          rounding: 'rounded-[3rem]',
          boxClass: 'border-4 border-black/10',
          btnClass: `rounded-[2rem] border-b-[6px] border-black/20 hover:border-b-0 hover:translate-y-[6px] transition-all font-black uppercase ${data.isRTL ? 'tracking-normal' : 'tracking-widest'}`,
          shadow: 'shadow-[8px_8px_0px_rgba(0,0,0,0.15)]'
        };
      case 'minimal':
        return {
          headingFont: `font-sans ${trackingTight} font-medium`,
          rounding: 'rounded-none',
          boxClass: 'border border-gray-200',
          btnClass: 'rounded-none hover:bg-black hover:text-white transition-colors font-medium border border-current',
          shadow: 'shadow-sm'
        };
      case 'bold':
        return {
          headingFont: `font-sans font-black uppercase ${trackingTighter}`,
          rounding: 'rounded-xl',
          boxClass: 'border-[6px] border-black',
          btnClass: 'rounded-xl font-black uppercase border-[3px] border-black hover:translate-x-1 hover:-translate-y-1 transition-transform',
          shadow: 'shadow-[8px_8px_0px_#000]'
        };
      case 'romantic':
        return {
          headingFont: 'font-serif font-medium',
          rounding: 'rounded-t-[80px] rounded-b-[40px]',
          boxClass: 'border border-gray-100 bg-white/90',
          btnClass: 'rounded-full hover:scale-105 transition-transform font-serif italic text-xl',
          shadow: 'shadow-[0_20px_50px_rgba(0,0,0,0.05)]'
        };
      case 'elegant':
      default:
        return {
          headingFont: 'font-serif font-medium',
          rounding: 'rounded-[40px]',
          boxClass: 'border border-gray-100',
          btnClass: 'rounded-full hover:scale-105 transition-all font-serif font-semibold text-lg',
          shadow: 'shadow-2xl'
        };
    }
  };

  const ui = getStyleConfig(data.uiStyle);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen pb-32"
      style={{ color: data.themeColors.text, backgroundColor: '#f9f9f9' }}
      dir={dir}
    >
      {/* Dev Reset Button */}
      <button onClick={onReset} className={`absolute top-6 ${data.isRTL ? 'right-6' : 'left-6'} z-50 p-2 rounded-full bg-black/30 text-white backdrop-blur-md pb-1.5 text-xs font-semibold pt-1.5 px-5 shadow-sm hover:bg-black/50 transition-all font-sans`}>
        {data.isRTL ? 'شروع مجدد ←' : '← Home'}
      </button>

      {/* Share Button (Host only) */}
      <button onClick={() => setShowShareModal(true)} className={`absolute top-6 ${data.isRTL ? 'left-6' : 'right-6'} z-50 flex items-center gap-2 rounded-full bg-white text-black backdrop-blur pb-2 text-xs font-semibold pt-2 px-6 shadow-2xl hover:scale-105 transition-all font-sans uppercase tracking-widest`}>
        <Share2 size={14} /> {data.isRTL ? 'اشتراک‌گذاری' : 'Share'}
      </button>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 font-sans"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className={`${ui.rounding} bg-white p-10 max-w-sm w-full ${ui.shadow} relative text-gray-900 ${ui.boxClass}`}
            >
              <button 
                onClick={() => setShowShareModal(false)}
                className={`absolute top-6 ${data.isRTL ? 'left-6' : 'right-6'} text-gray-400 hover:text-gray-800 transition-colors`}
              >
                <X size={24} />
              </button>
              
              <div className="text-center mb-10">
                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 shadow-inner">
                  <QrCodeIcon size={28} className="text-gray-700" />
                </div>
                <h3 className={`text-3xl ${ui.headingFont} text-gray-900 mb-3 text-balance`} style={{ lineHeight: data.isRTL ? '1.5' : '1.25' }}>
                  {data.isRTL ? 'دعوت مهمانان' : 'Invite your guests'}
                </h3>
              </div>

              <div className={`bg-white p-6 ${ui.rounding} border border-gray-100 shadow-sm flex justify-center mb-8`}>
                <QRCode value={window.location.href} size={180} fgColor="#1a1a1a" />
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input readOnly value={window.location.href} className="flex-1 w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-xs text-gray-600 outline-none focus:border-gray-200 transition-colors" dir="ltr" />
                  <button 
                    onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert(data.isRTL ? 'کپی شد!' : 'Link copied to clipboard!');
                    }}
                    className="bg-gray-900 text-white rounded-2xl px-5 py-4 text-xs font-semibold tracking-wide shadow-md hover:bg-black transition-all shrink-0"
                  >
                    {data.isRTL ? 'کپی' : 'Copy'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header - Full Bleed Editorial Style */}
      <div className="relative w-full h-[85vh] lg:h-[90vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 z-10" /> 
        {data.images?.hero && (
           <motion.img 
             initial={{ scale: 1.05 }}
             animate={{ scale: 1 }}
             transition={{ duration: 1.5, ease: "easeOut" }}
             src={data.images.hero} 
             alt={data.themeName}
             className="absolute inset-0 w-full h-full object-cover"
           />
        )}
        
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-16 lg:p-24 pb-20 md:pb-32 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="w-full"
          >
            <div className={`inline-block px-4 py-2 ${ui.rounding} text-xs font-bold tracking-[0.15em] uppercase mb-6 md:mb-8 backdrop-blur-md bg-white/15 text-white border border-white/20`}
                 style={data.isRTL ? { letterSpacing: 'normal' } : {}}>
              {data.themeName}
            </div>
            {/* Carefully adjusted typography scaling for Mobile vs Desktop, and RTL line-height support */}
            <h1 className={`${ui.headingFont} text-4xl sm:text-5xl md:text-6xl lg:text-8xl text-white mb-6 md:mb-8 text-balance drop-shadow-xl`}
                style={{ lineHeight: data.isRTL ? '1.5' : '1.1' }}>
              {data.title}
            </h1>
            <p className={`${data.uiStyle === 'bold' ? 'font-sans font-bold' : 'font-serif italic'} text-xl md:text-3xl text-white/90 drop-shadow-md text-balance max-w-3xl`}
               style={data.isRTL ? { fontStyle: 'normal' } : {}}>
              {data.welcomeMessage}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area - Overlapping the Hero securely */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 md:-mt-20 relative z-30">
        
        {/* Details Bar */}
        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className={`bg-white ${ui.rounding} ${ui.shadow} ${ui.boxClass} overflow-hidden mb-16 md:mb-32`}
          style={{ backgroundColor: data.themeColors.background }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b" 
               style={{ borderColor: `${data.themeColors.text}15` }}>
            <div className="p-8 lg:p-12 flex flex-col items-center justify-center text-center gap-4 hover:bg-black/5 transition-colors">
              <Calendar size={28} style={{ color: data.themeColors.primary }} strokeWidth={1.5} />
              <div>
                <p className="font-sans font-bold text-xs tracking-[0.2em] uppercase mb-2 opacity-60">
                    {data.isRTL ? 'تاریخ' : 'When'}
                </p>
                <p className={`${ui.headingFont} text-2xl`}>{data.date}</p>
              </div>
            </div>
            <div className="p-8 lg:p-12 flex flex-col items-center justify-center text-center gap-4 hover:bg-black/5 transition-colors">
              <Clock size={28} style={{ color: data.themeColors.primary }} strokeWidth={1.5} />
              <div>
                <p className="font-sans font-bold text-xs tracking-[0.2em] uppercase mb-2 opacity-60">
                    {data.isRTL ? 'زمان' : 'Time'}
                </p>
                <p className={`${ui.headingFont} text-2xl`}>{data.time}</p>
              </div>
            </div>
            <div className="p-8 lg:p-12 flex flex-col items-center justify-center text-center gap-4 hover:bg-black/5 transition-colors">
              <MapPin size={28} style={{ color: data.themeColors.primary }} strokeWidth={1.5} />
              <div>
                <p className="font-sans font-bold text-xs tracking-[0.2em] uppercase mb-2 opacity-60">
                    {data.isRTL ? 'مکان' : 'Where'}
                </p>
                <p className={`${ui.headingFont} text-2xl tracking-normal leading-tight text-balance`}>{data.location}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Description Section with Image Split */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className={`grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden ${ui.rounding} ${ui.shadow} bg-white ${ui.boxClass} mb-32`}
          style={{ backgroundColor: data.themeColors.background }}
        >
          <div className="p-8 lg:p-24 flex flex-col justify-center text-center lg:text-start" style={data.isRTL ? { textAlign: 'right' } : {}}>
            <Sparkles className={`mb-8 opacity-40 ${data.isRTL ? 'mr-auto lg:mr-0 ml-auto lg:ml-auto' : 'mx-auto lg:mx-0'}`} size={32} />
            <p className={`${ui.headingFont} text-3xl md:text-4xl leading-relaxed text-balance`} style={{ lineHeight: data.isRTL ? '1.7' : '1.5' }}>
              {data.description}
            </p>
          </div>
          <div className="relative min-h-[300px] lg:min-h-full w-full">
            {data.images?.details && (
              <img 
                src={data.images.details} 
                alt="Event detail" 
                className="absolute inset-0 w-full h-full object-cover" 
              />
            )}
          </div>
        </motion.div>

        {/* Timeline Section */}
        {data.schedule && data.schedule.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="mb-32 max-w-6xl mx-auto"
          >
            <div className="text-center mb-20">
              <h2 className={`${ui.headingFont} text-5xl md:text-6xl mb-6`} style={{ lineHeight: data.isRTL ? '1.5' : '1.2' }}>
                 {data.isRTL ? 'برنامه رویداد متحرک' : 'The Itinerary'}
              </h2>
              <div className="w-16 h-1 bg-current mx-auto opacity-30 rounded-full"></div>
            </div>
            
            <div className="space-y-16 md:space-y-32">
                {data.schedule.map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: 0.1, duration: 0.8 }}
                    // Reversing flex alternating for visual rhythm
                    className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 md:gap-16 items-center`}
                  >
                    <div className={`w-full md:w-1/2 aspect-[4/3] ${ui.rounding} overflow-hidden ${ui.shadow} ${ui.boxClass}`}>
                       {data.images?.timeline?.[i] && (
                         <img 
                           src={data.images.timeline[i]} 
                           alt={item.title}
                           className="w-full h-full object-cover hover:scale-110 transition-transform duration-[1.5s] ease-out" 
                         />
                       )}
                    </div>
                    <div className={`w-full md:w-1/2 md:px-8 text-center md:text-start`} style={data.isRTL && i % 2 !== 0 ? { textAlign: 'right' } : data.isRTL ? { textAlign: 'right' } : {}}>
                       <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 bg-black/5" style={{ color: data.themeColors.primary }}>
                         {item.time}
                       </div>
                       <h4 className={`${ui.headingFont} text-4xl md:text-5xl mb-6`} style={{ lineHeight: data.isRTL ? '1.5' : '1.25' }}>{item.title}</h4>
                       <p className="font-sans opacity-70 leading-relaxed text-balance text-lg md:text-xl">
                         {item.description}
                       </p>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Location Map */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className={`mb-32 ${ui.rounding} overflow-hidden ${ui.shadow} bg-white ${ui.boxClass} p-4 md:p-6`} 
          style={{ backgroundColor: data.themeColors.background }}
        >
          <div className={`w-full h-[400px] md:h-[500px] ${ui.rounding} overflow-hidden relative`}>
            <iframe
              title="Event Location"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=${(import.meta as any).env?.VITE_MAPS_API_KEY || ''}&q=${encodeURIComponent(data.location)}`}
            ></iframe>
          </div>
          <div className="text-center mt-8 mb-4 flex justify-center">
            <a href={`https://maps.google.com/?q=${encodeURIComponent(data.location)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 font-sans font-bold text-sm tracking-[0.1em] uppercase hover:opacity-60 transition-opacity bg-black text-white px-8 py-4 rounded-full shadow-lg">
              <span>{data.isRTL ? 'مسیریابی در گوگل مپ' : 'Directions via Google'}</span>
              <ArrowRight size={16} className={data.isRTL ? 'rotate-180' : ''} />
            </a>
          </div>
        </motion.div>

        {/* Dynamic Image & RSVP Form Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className={`grid grid-cols-1 lg:grid-cols-2 overflow-hidden ${ui.rounding} ${ui.shadow} ${ui.boxClass} mb-16`}
          style={{ backgroundColor: data.themeColors.background }}
        >
          <div className="relative min-h-[300px] lg:min-h-[600px] w-full">
            {data.images?.rsvp && (
              <img 
                src={data.images.rsvp} 
                alt="RSVP Background" 
                className="absolute inset-0 w-full h-full object-cover" 
              />
            )}
          </div>

          <div className="p-8 sm:p-10 md:p-16 lg:p-20 flex flex-col justify-center text-center md:text-start" style={data.isRTL ? { textAlign: 'right' } : {}}>
            <h2 className={`${ui.headingFont} text-5xl md:text-6xl mb-6`} style={{ lineHeight: data.isRTL ? '1.5' : '1.25' }}>
                {data.isRTL ? 'آیا شما را خواهیم دید؟' : 'Will we see you?'}
            </h2>
            <p className="font-sans opacity-70 mb-12 text-lg text-balance" style={{ lineHeight: '1.7' }}>
              {data.isRTL ? 'ایمیل خود را ثبت کنید تا بعد از مراسم، لینک عکس‌های رویداد برای شما ارسال شود.' : 'Leave your email to automatically receive the shared photo gallery after the gathering.'}
            </p>
            
            <AnimatePresence mode="wait">
              {rsvpState === 'success' ? (
                <motion.div 
                  key="success"
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className={`bg-white/40 backdrop-blur-md ${ui.rounding} p-12 flex flex-col items-center gap-6 shadow-xl border border-white/50 text-center`}
                >
                  <div className="w-20 h-20 rounded-full flex items-center justify-center bg-green-50 shadow-inner text-green-600">
                    <Heart size={36} fill="currentColor" className="opacity-90" />
                  </div>
                  <h3 className={`${ui.headingFont} text-4xl`} style={{ lineHeight: data.isRTL ? '1.5' : '1.25' }}>
                      {data.isRTL ? 'بی‌صبرانه منتظریم!' : 'Cannot Wait'}
                  </h3>
                  <p className="font-sans opacity-70 text-lg">
                    {data.isRTL ? 'حضور شما ثبت شد. می‌بینیمتون.' : 'Your reservation is confirmed. See you there.'}
                  </p>
                </motion.div>
              ) : (
                <motion.form 
                  key="form"
                  onSubmit={handleRSVP}
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6 font-sans text-start w-full"
                >
                  <div className="space-y-6">
                    <div>
                      <label className={`block text-xs font-bold uppercase ${data.isRTL ? 'tracking-normal pr-2' : 'tracking-widest pl-2'} mb-3 opacity-60`}>
                          {data.isRTL ? 'نام مهمان' : 'Guest Name'}
                      </label>
                      <input 
                        required
                        type="text" 
                        className={`w-full px-6 py-5 bg-white border border-gray-200 shadow-sm focus:ring-2 focus:ring-black outline-none transition-all ${ui.rounding} text-lg`}
                        placeholder={data.isRTL ? "مثال: علی رضایی" : "Jane Doe"}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase ${data.isRTL ? 'tracking-normal pr-2' : 'tracking-widest pl-2'} mb-3 opacity-60`}>
                          {data.isRTL ? 'آدرس ایمیل' : 'Email Address'}
                      </label>
                      <input 
                        required
                        type="email" 
                        className={`w-full px-6 py-5 bg-white border border-gray-200 shadow-sm focus:ring-2 focus:ring-black outline-none transition-all ${ui.rounding} text-lg`}
                        placeholder={data.isRTL ? "برای دریافت لینک گالری" : "For the gallery link"}
                        style={data.isRTL ? { direction: 'ltr', textAlign: 'right' } : {}}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-8">
                    <button 
                      type="submit"
                      disabled={rsvpState === 'submitting'}
                      className={`w-full ${ui.btnClass} flex justify-center items-center py-6 text-lg shadow-xl`}
                      style={{ 
                        backgroundColor: data.themeColors.primary, 
                        color: data.themeColors.background 
                      }}
                    >
                      {rsvpState === 'submitting' 
                          ? (data.isRTL ? 'در حال ثبت...' : 'Confirming...') 
                          : (data.isRTL ? 'بله، شرکت می‌کنم' : 'Yes, I will attend')}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="pb-12 w-full text-center pointer-events-none mt-16">
        <p className="font-sans text-xs tracking-[0.2em] uppercase opacity-40 font-bold">
          {data.isRTL ? 'ساخته شده با ' : 'Powered by '}
          <strong className="font-serif text-sm tracking-normal capitalize">Gatherly</strong>
        </p>
      </div>
    </motion.div>
  );
}