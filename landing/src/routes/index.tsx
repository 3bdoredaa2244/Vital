import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

// The authenticated VITAL web app. Set VITE_APP_URL per environment (Vercel);
// falls back to the local dev port so the repo works out of the box.
const APP_URL = import.meta.env.VITE_APP_URL ?? "http://localhost:3003";
const LOGIN_URL = `${APP_URL}/login`;
const SIGNUP_URL = `${APP_URL}/signup`;

// Color tokens
const T = {
  canvas:     '#FBF6EC',   // warm cream
  panel:      '#F3EAD9',   // slightly darker cream
  card:       '#FFFFFF',   // pure white
  line:       '#E7DECC',   // warm beige
  ink:        '#20201C',   // near-black
  inkSoft:    '#6B6459',   // warm grey
  inkMuted:   '#A79E8D',   // muted warm
  green:      '#6FA97D',   // sage green
  greenInk:   '#3E7A53',   // darker green
  amber:      '#CDA24E',   // warm amber
  accent:     '#C2603C',   // terracotta
  accentSoft: '#E0A98C',   // soft terracotta
};

const categories = [
  { id: 'METABOLIC', name: 'METABOLIC', score: 87, color: T.green },
  { id: 'CARDIOVASCULAR', name: 'CARDIOVASCULAR', score: 74, color: T.amber },
  { id: 'HORMONAL', name: 'HORMONAL', score: 61, color: T.amber },
  { id: 'NUTRITIONAL', name: 'NUTRITIONAL', score: 92, color: T.green },
  { id: 'INFLAMMATORY', name: 'INFLAMMATORY', score: 89, color: T.green },
];

const testCategoriesData = [
  {
    title: "METABOLIC",
    count: "12 markers",
    borderColor: "border-l-[#6FA97D]",
    desc: "Insulin, HbA1c, fasting glucose, uric acid. Identifies underlying metabolic shifts before weight changes.",
    markers: ["Fasting Insulin", "HbA1c", "Fasting Glucose", "Uric Acid", "Triglycerides", "Total Cholesterol", "HDL Cholesterol", "LDL Cholesterol", "VLDL Cholesterol", "Adiponectin", "Leptin", "Metabolic Score"]
  },
  {
    title: "CARDIOVASCULAR",
    count: "12 markers",
    borderColor: "border-l-[#C2603C]",
    desc: "ApoB, ApoA1, Lipoprotein(a), hs-CRP. Goes deeper than a standard panel to evaluate endothelial arterial risk.",
    markers: ["Apolipoprotein B (ApoB)", "Apolipoprotein A1 (ApoA1)", "ApoB / ApoA1 Ratio", "Lipoprotein(a)", "High-Sensitivity CRP", "Homocysteine", "LDL Particle Number", "Small Dense LDL", "HDL Subfractions", "Fibrinogen", "Myeloperoxidase", "Arterial Score"]
  },
  {
    title: "THYROID",
    count: "8 markers",
    borderColor: "border-l-[#9B7FD4]",
    desc: "Free T3, Free T4, TSH, Thyroid Antibodies. Complete energetic monitoring, not just basic screeners.",
    markers: ["Free Triiodothyronine (FT3)", "Free Thyroxine (FT4)", "TSH (Thyroid Stimulating Hormone)", "Thyroglobulin Antibodies", "Thyroid Peroxidase (TPO) Antibodies", "Reverse T3", "Total T3", "Total T4"]
  },
  {
    title: "HORMONAL",
    count: "12 markers",
    borderColor: "border-l-[#CDA24E]",
    desc: "DHEA-S, Total/Free Testosterone, SHBG, Cortisol. Essential baseline monitoring for energy and physical composition.",
    markers: ["DHEA-Sulfate", "Total Testosterone", "Free Testosterone", "Sex Hormone-Binding Globulin (SHBG)", "Cortisol (Am)", "Estradiol (E2)", "Progesterone", "Luteinizing Hormone (LH)", "Follicle-Stimulating Hormone (FSH)", "Prolactin", "Androstenedione", "Hormonal Balance Index"]
  },
  {
    title: "VITAMINS",
    count: "15 markers",
    borderColor: "border-l-[#4A9FB5]",
    desc: "Active D3, B12, Serum Iron, Ferritin, Zinc. Tracks baseline trace elements and foundational cellular energy blocks.",
    markers: ["Active Vitamin D3 (25-OH)", "Vitamin B12 (Cobalamin)", "Serum Folate (B9)", "Serum Iron", "Ferritin", "Total Iron Binding Capacity (TIBC)", "Transferrin Saturation", "Zinc", "Magnesium (RBC)", "Selenium", "Copper", "Vitamin A", "Vitamin E", "Vitamin C", "Coenzyme Q10"]
  },
  {
    title: "INFLAMMATION",
    count: "6 markers",
    borderColor: "border-l-[#E0844A]",
    desc: "High-sensitivity CRP, Homocysteine, ESR. Maps overall arterial stress and silent systemic irritation.",
    markers: ["High-sensitivity CRP (hs-CRP)", "Homocysteine", "Erythrocyte Sedimentation Rate (ESR)", "Fibrinogen Activity", "Interleukin-6 (IL-6)", "TNF-Alpha"]
  },
  {
    title: "LIVER & KIDNEY",
    count: "12 markers",
    borderColor: "border-l-[#6B9E6B]",
    desc: "ALT, AST, eGFR, Creatinine, Bilirubin. Critical functional feedback on processing systems and drug filtration clearance.",
    markers: ["Alanine Aminotransferase (ALT)", "Aspartate Aminotransferase (AST)", "eGFR (Estimated Glomerular Filtration Rate)", "Creatinine", "BUN (Blood Urea Nitrogen)", "BUN / Creatinine Ratio", "Total Bilirubin", "Alkaline Phosphatase", "Albumin", "Globulin", "Total Protein", "Gamma-Glutamyl Transferase (GGT)"]
  },
  {
    title: "BLOOD COUNT",
    count: "13 markers",
    borderColor: "border-l-[#B55A7A]",
    desc: "Complete Hemogram, red cells, platelets. Foundational structural monitoring of oxygen-carrying status.",
    markers: ["Red Blood Cell Count (RBC)", "Hemoglobin", "Hematocrit", "Mean Corpuscular Volume (MCV)", "Mean Corpuscular Hemoglobin (MCH)", "MCHC", "White Blood Cell Count (WBC)", "Neutrophils", "Lymphocytes", "Monocytes", "Eosinophils", "Basophils", "Platelet Count"]
  }
];

function Index() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricingPeriod, setPricingToggle] = useState<'monthly' | 'annual'>('monthly');

  // Live score status dial
  const [dialIdx, setDialIdx] = useState(0);
  const currentCategory = categories[dialIdx];

  // Active expanded biomarker card
  const [expandedCardIdx, setExpandedCardIdx] = useState<number | null>(null);

  // Form states
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDialIdx((prev) => (prev + 1) % categories.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setWaitlistSuccess(true);
      setWaitlistEmail("");
    }, 800);
  };

  // Custom Intersection Observer reveal hook logic in pure React
  const useIntersectionReveal = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(entry.target);
        }
      }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, []);

    return { ref, revealed };
  };

  const r1 = useIntersectionReveal();
  const r2 = useIntersectionReveal();
  const r3 = useIntersectionReveal();
  const r4 = useIntersectionReveal();
  const r5 = useIntersectionReveal();
  const r6 = useIntersectionReveal();
  const r7 = useIntersectionReveal();
  const r8 = useIntersectionReveal();

  return (
    <div className="min-h-screen selection:bg-[#E0A98C] selection:text-[#20201C]" style={{ fontFamily: '"Inter", sans-serif' }}>
      
      {/* SECTION 1 - Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-6 md:px-10 transition-all duration-300 ${
        navScrolled ? 'bg-[#FBF6EC]/95 backdrop-blur-md border-b border-[#E7DECC] shadow-sm' : 'bg-transparent'
      }`}>
        <div className="flex items-center gap-3.5">
          <img src="/assets/vital-logomark.svg" alt="vital logomark" className="w-11 h-11" />
          <a href="#" className="text-3xl font-extrabold tracking-[-0.03em] text-[#20201C] lowercase" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
            vital
          </a>
        </div>

        {/* Center menu links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#problem" className="text-sm font-medium text-[#6B6459] hover:text-[#C2603C] transition-colors">Problem</a>
          <a href="#platform" className="text-sm font-medium text-[#6B6459] hover:text-[#C2603C] transition-colors">Platform</a>
          <a href="#pricing" className="text-sm font-medium text-[#6B6459] hover:text-[#C2603C] transition-colors">Pricing</a>
          <a href="#science" className="text-sm font-medium text-[#6B6459] hover:text-[#C2603C] transition-colors">Science</a>
        </nav>

        {/* Right Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <a href={LOGIN_URL} className="text-sm font-medium text-[#6B6459] hover:text-[#20201C] px-4 py-2 border border-[#E7DECC] rounded-lg transition-all hover:border-[#C2603C]">
            Sign In
          </a>
          <a href={SIGNUP_URL} className="text-sm font-semibold text-[#FBF6EC] bg-[#C2603C] px-5 py-2.5 rounded-lg hover:bg-[#A34E30] shadow-sm hover:shadow-[0_4px_16px_rgba(194,96,60,0.25)] transition-all">
            Get Started &rarr;
          </a>
        </div>

        {/* Mobile menu toggle */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col justify-center gap-1.5 w-6 h-6 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <span className={`w-full h-0.5 bg-[#20201C] transition-transform duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`w-full h-0.5 bg-[#20201C] transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`w-full h-0.5 bg-[#20201C] transition-transform duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </header>

      {/* Mobile nav overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#FBF6EC] flex flex-col justify-center px-10 gap-8 animate-fade-in md:hidden">
          <nav className="flex flex-col gap-6 text-2xl font-semibold" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
            <a href="#problem" onClick={() => setMobileMenuOpen(false)} className="text-[#20201C] hover:text-[#C2603C]">The Problem</a>
            <a href="#platform" onClick={() => setMobileMenuOpen(false)} className="text-[#20201C] hover:text-[#C2603C]">The Platform</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-[#20201C] hover:text-[#C2603C]">Pricing &amp; Membership</a>
            <a href="#science" onClick={() => setMobileMenuOpen(false)} className="text-[#20201C] hover:text-[#C2603C]">Our Science</a>
          </nav>
          <div className="flex flex-col gap-4 mt-4">
            <a href={LOGIN_URL} onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-3.5 rounded-lg border border-[#E7DECC] text-[#20201C] font-semibold">
              Sign In
            </a>
            <a href={SIGNUP_URL} onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-3.5 rounded-lg bg-[#C2603C] text-[#FBF6EC] font-semibold shadow-md">
              Get Started &rarr;
            </a>
          </div>
        </div>
      )}

      {/* SECTION 2 - Hero */}
      <section className="relative min-h-[100dvh] flex items-center bg-[#FBF6EC] pt-24 pb-16 px-6 md:px-10 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(ellipse 60% 60% at 75% 50%, rgba(194,96,60,0.04), transparent)' }} />
        
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          
          {/* Hero text */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6FA97D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6FA97D]"></span>
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C2603C]">
                Egypt's first preventive health platform
              </p>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-[-0.03em] leading-[1.1] text-[#20201C] mb-6" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
              Know your body.<br/>
              Before it needs you to.
            </h1>

            <p className="text-base sm:text-lg text-[#6B6459] leading-relaxed max-w-[500px] mb-8">
              Most health tests only happen after something goes wrong. vital gives you 80+ biomarkers, twice a year - so you see what's coming before it arrives.
            </p>

            <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3 max-w-[520px] mb-12">
              <input
                type="email"
                required
                placeholder="Enter your email for early access"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                className="flex-1 px-4 py-3 border border-[#E7DECC] bg-[#FBF6EC] text-[#20201C] placeholder-[#A79E8D] rounded-lg focus:outline-none focus:border-[#C2603C] text-sm"
              />
              <button 
                type="submit" 
                disabled={submitting}
                className="bg-[#C2603C] text-[#FBF6EC] font-semibold text-sm px-6 py-3 rounded-lg hover:bg-[#A34E30] active:scale-[0.98] shadow-sm hover:shadow-[0_4px_16px_rgba(194,96,60,0.25)] transition-all flex items-center justify-center"
              >
                {submitting ? "Joining..." : "Get Started \u2192"}
              </button>
            </form>

            {waitlistSuccess && (
              <p className="text-sm text-[#3E7A53] font-medium mb-6 bg-[#6FA97D]/10 px-4 py-2.5 rounded-lg border border-[#6FA97D]/30 inline-block self-start">
                Thank you. You've been added to the preventive health waitlist.
              </p>
            )}

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[#E7DECC]">
              <div>
                <h3 className="text-3xl font-bold tracking-tight text-[#20201C]" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>105M</h3>
                <p className="text-xs text-[#6B6459] mt-1">Egyptians</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold tracking-tight text-[#20201C]" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>80+</h3>
                <p className="text-xs text-[#6B6459] mt-1">Biomarkers</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold tracking-tight text-[#20201C]" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>2&times;</h3>
                <p className="text-xs text-[#6B6459] mt-1">Tests per year</p>
              </div>
            </div>
          </div>

          {/* Hero Interactive Dial Card — Dynamic Labs Summary Dashboard mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="bg-white border border-[#E7DECC] rounded-3xl p-6 w-full max-w-[420px] shadow-[0_8px_32px_rgba(32,32,28,0.08)] relative overflow-hidden">
              
              {/* Header Section */}
              <div className="mb-6">
                <h4 className="text-xl font-extrabold tracking-[-0.03em] text-[#20201C]" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                  Labs Summary
                </h4>
                <p className="text-xs text-[#6B6459] mt-0.5">
                  42 biomarkers updated from your test on 18 Apr 2026
                </p>
              </div>

              {/* Central Segmented Ring Visualization */}
              <div className="flex flex-col items-center justify-center my-6">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <g transform="translate(50,50)">
                      {/* Segmented Ring: 24 bars. Fills red/orange/yellow/green for the tested 42, grey for untested */}
                      {/* Tested metrics - Green range */}
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#6FA97D" transform="rotate(0)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#6FA97D" transform="rotate(15)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#6FA97D" transform="rotate(30)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#6FA97D" transform="rotate(45)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#6FA97D" transform="rotate(60)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#6FA97D" transform="rotate(75)" />
                      
                      {/* Tested metrics - Yellow/Amber range */}
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#CDA24E" transform="rotate(90)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#CDA24E" transform="rotate(105)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#CDA24E" transform="rotate(120)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#CDA24E" transform="rotate(135)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#CDA24E" transform="rotate(150)" />
                      
                      {/* Tested metrics - Orange/Red range */}
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#C2603C" transform="rotate(165)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#C2603C" transform="rotate(180)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#C2603C" transform="rotate(195)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#C2603C" transform="rotate(210)" />

                      {/* Untested / Greyed out indicators */}
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#E7DECC" transform="rotate(225)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#E7DECC" transform="rotate(240)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#E7DECC" transform="rotate(255)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#E7DECC" transform="rotate(270)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#E7DECC" transform="rotate(285)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#E7DECC" transform="rotate(300)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#E7DECC" transform="rotate(315)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#E7DECC" transform="rotate(330)" />
                      <rect x="-1.5" y="-45" width="3" height="8" rx="1" fill="#E7DECC" transform="rotate(345)" />
                    </g>
                  </svg>
                  
                  {/* Inside Center Copy */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-5xl font-extrabold tracking-tight text-[#20201C]" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                      42
                    </span>
                    <span className="text-[9px] tracking-[0.15em] text-[#6B6459] font-bold uppercase mt-1">
                      BIOMARKERS
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-[#A79E8D] mt-3">42 of 60 markers tested</p>
              </div>

              {/* Summary Category Cards */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <div className="bg-[#FBF6EC] border border-[#E7DECC]/60 rounded-xl p-3 text-center">
                  <h5 className="text-2xl font-extrabold text-[#6FA97D]" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>28</h5>
                  <p className="text-[10px] text-[#6B6459] mt-1 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6FA97D]"></span> Optimal
                  </p>
                </div>
                <div className="bg-[#FBF6EC] border border-[#E7DECC]/60 rounded-xl p-3 text-center shadow-sm">
                  <h5 className="text-2xl font-extrabold text-[#CDA24E]" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>10</h5>
                  <p className="text-[10px] text-[#6B6459] mt-1 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CDA24E]"></span> Review
                  </p>
                </div>
                <div className="bg-[#FBF6EC] border border-[#E7DECC]/60 rounded-xl p-3 text-center">
                  <h5 className="text-2xl font-extrabold text-[#C2603C]" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>4</h5>
                  <p className="text-[10px] text-[#6B6459] mt-1 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C2603C]"></span> Out of Range
                  </p>
                </div>
              </div>

              {/* Insight Notification Box */}
              <div className="border border-[#E7DECC] bg-[#C2603C]/5 rounded-xl p-4 mb-4 text-left">
                <p className="text-xs text-[#20201C] font-semibold leading-relaxed">
                  Cardiovascular has 3 markers out of range — the top area to focus on.
                </p>
                <a href="#pricing" className="text-[10px] font-bold text-[#C2603C] hover:text-[#A34E30] transition-colors mt-2.5 inline-block uppercase tracking-wider">
                  EXPLORE YOUR LABS IN DETAIL &rarr;
                </a>
              </div>

              {/* Minimal Search Bar Mock */}
              <div className="relative flex items-center mt-4">
                <span className="absolute left-3 text-[#A79E8D] text-xs">🔍</span>
                <input
                  type="text"
                  disabled
                  placeholder="Search for Vitamin D, Cortisol..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#FBF6EC] border border-[#E7DECC] rounded-xl text-xs text-[#20201C] placeholder-[#A79E8D] outline-none"
                />
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3 - The Problem */}
      <section id="problem" className="bg-[#F3EAD9] border-t border-[#E7DECC] py-24 px-6 md:px-10">
        <div ref={r1.ref} className={`max-w-7xl mx-auto transition-all duration-700 ease-out ${r1.revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-16">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A79E8D] mb-3">The Problem</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-[-0.02em] leading-tight text-[#20201C]" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                Healthcare in Egypt<br/>
                is entirely reactive.
              </h2>
            </div>
            <div>
              <p className="text-base text-[#6B6459] leading-relaxed max-w-[440px] pt-4 lg:pt-8">
                Most people discover conditions only after symptoms appear. By then, the damage is already done. vital gives you the data to act years earlier.
              </p>
            </div>
          </div>

          {/* Condition Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-[#E7DECC] border border-[#E7DECC] rounded-xl overflow-hidden mb-16">
            
            <div className="bg-[#FBF6EC] p-6 hover:bg-white transition-all duration-300 group">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C2603C] block mb-4"></span>
              <h4 className="text-base font-semibold text-[#20201C]">Insulin Resistance</h4>
              <p className="text-xs text-[#6B6459] mt-2 leading-relaxed">Precedes diabetes years before diagnosis</p>
            </div>

            <div className="bg-[#FBF6EC] p-6 hover:bg-white transition-all duration-300 group">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C2603C] block mb-4"></span>
              <h4 className="text-base font-semibold text-[#20201C]">Prediabetes</h4>
              <p className="text-xs text-[#6B6459] mt-2 leading-relaxed">70% undiagnosed in Egypt</p>
            </div>

            <div className="bg-[#FBF6EC] p-6 hover:bg-white transition-all duration-300 group">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C2603C] block mb-4"></span>
              <h4 className="text-base font-semibold text-[#20201C]">Fatty Liver</h4>
              <p className="text-xs text-[#6B6459] mt-2 leading-relaxed">Silent until advanced stage</p>
            </div>

            <div className="bg-[#FBF6EC] p-6 hover:bg-white transition-all duration-300 group">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C2603C] block mb-4"></span>
              <h4 className="text-base font-semibold text-[#20201C]">Hormonal Dysfunction</h4>
              <p className="text-xs text-[#6B6459] mt-2 leading-relaxed">Routinely missed by standard checkups</p>
            </div>

            <div className="bg-[#FBF6EC] p-6 hover:bg-white transition-all duration-300 group">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C2603C] block mb-4"></span>
              <h4 className="text-base font-semibold text-[#20201C]">Cardiovascular Risk</h4>
              <p className="text-xs text-[#6B6459] mt-2 leading-relaxed">Leading cause of death, yet highly preventable</p>
            </div>

            <div className="bg-[#FBF6EC] p-6 hover:bg-white transition-all duration-300 group">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C2603C] block mb-4"></span>
              <h4 className="text-base font-semibold text-[#20201C]">Nutrient Deficiencies</h4>
              <p className="text-xs text-[#6B6459] mt-2 leading-relaxed">Vitamin D, B12, Iron chronically low</p>
            </div>

            <div className="bg-[#FBF6EC] p-6 hover:bg-white transition-all duration-300 group">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C2603C] block mb-4"></span>
              <h4 className="text-base font-semibold text-[#20201C]">Chronic Inflammation</h4>
              <p className="text-xs text-[#6B6459] mt-2 leading-relaxed">Root cause of most chronic disease</p>
            </div>

            <div className="bg-[#FBF6EC] p-6 hover:bg-white transition-all duration-300 group">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C2603C] block mb-4"></span>
              <h4 className="text-base font-semibold text-[#20201C]">Thyroid Dysfunction</h4>
              <p className="text-xs text-[#6B6459] mt-2 leading-relaxed">TSH alone misses 15% of cases</p>
            </div>

          </div>

          {/* 3 Stat blocks row */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-[#E7DECC] pt-12 gap-8">
            <div className="border-r border-[#E7DECC] last:border-r-0 pr-4">
              <h3 className="text-4xl md:text-5xl font-extrabold text-[#C2603C]" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>&lt; 20</h3>
              <p className="text-xs text-[#6B6459] mt-2 max-w-[240px] leading-relaxed">Biomarkers in a typical annual checkup</p>
            </div>
            <div className="border-r border-[#E7DECC] last:border-r-0 pr-4">
              <h3 className="text-4xl md:text-5xl font-extrabold text-[#C2603C]" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>0</h3>
              <p className="text-xs text-[#6B6459] mt-2 max-w-[240px] leading-relaxed">Longitudinal health platforms in Egypt</p>
            </div>
            <div className="pr-4">
              <h3 className="text-4xl md:text-5xl font-extrabold text-[#C2603C]" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>5&times;</h3>
              <p className="text-xs text-[#6B6459] mt-2 max-w-[240px] leading-relaxed">More expensive to treat late-stage than prevent early</p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 4 - The Platform */}
      <section id="platform" className="bg-[#FBF6EC] border-t border-[#E7DECC] py-24 px-6 md:px-10">
        <div ref={r2.ref} className={`max-w-7xl mx-auto transition-all duration-700 ease-out ${r2.revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left features accordion list */}
            <div className="lg:col-span-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A79E8D] mb-3">The Platform</p>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-[-0.02em] leading-tight text-[#20201C] mb-8" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                A complete operating system for your health.
              </h2>

              <div className="space-y-4">
                
                <div className="border-b border-[#E7DECC] pb-6">
                  <div className="flex gap-4 items-start">
                    <span className="text-xs font-semibold text-[#C2603C] mt-1">01</span>
                    <div>
                      <h4 className="text-base font-semibold text-[#20201C]">Comprehensive Biomarker Panel</h4>
                      <p className="text-xs text-[#6B6459] mt-2 leading-relaxed">
                        80+ biomarkers tested annually through certified partner labs. Metabolic, hormonal, cardiovascular, nutritional, and inflammatory flags.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-b border-[#E7DECC] pb-6">
                  <div className="flex gap-4 items-start">
                    <span className="text-xs font-semibold text-[#C2603C] mt-1">02</span>
                    <div>
                      <h4 className="text-base font-semibold text-[#20201C]">Longitudinal Health Dashboard</h4>
                      <p className="text-xs text-[#6B6459] mt-2 leading-relaxed">
                        All results stored and visualized over time. Track health trends, spot deviations, and understand your longevity trajectory year over year.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-b border-[#E7DECC] pb-6">
                  <div className="flex gap-4 items-start">
                    <span className="text-xs font-semibold text-[#C2603C] mt-1">03</span>
                    <div>
                      <h4 className="text-base font-semibold text-[#20201C]">Optimal Range Comparison</h4>
                      <p className="text-xs text-[#6B6459] mt-2 leading-relaxed">
                        Your results compared against functional optimal ranges - not just standard lab reference ranges. The difference between survival and thriving.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-b border-[#E7DECC] pb-6">
                  <div className="flex gap-4 items-start">
                    <span className="text-xs font-semibold text-[#C2603C] mt-1">04</span>
                    <div>
                      <h4 className="text-base font-semibold text-[#20201C]">Educational Health Insights</h4>
                      <p className="text-xs text-[#6B6459] mt-2 leading-relaxed">
                        Every biomarker explained in plain language. Understand what it measures, why it matters, and the direct habits affecting it.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pb-4">
                  <div className="flex gap-4 items-start">
                    <span className="text-xs font-semibold text-[#A79E8D] mt-1">05</span>
                    <div>
                      <h4 className="text-base font-semibold text-[#A79E8D] inline-flex items-center gap-2">
                        AI Health Coach <span className="text-[10px] font-medium bg-[#E7DECC] px-2 py-0.5 rounded-full text-[#6B6459]">Coming soon</span>
                      </h4>
                      <p className="text-xs text-[#A79E8D] mt-2 leading-relaxed">
                        Personalized supplement, nutrition, and lifestyle recommendations dynamically based on your ongoing health panel.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right mock UI card */}
            <div className="lg:col-span-6 flex justify-center w-full">
              <div className="bg-white border border-[#E7DECC] rounded-2xl p-6 w-full max-w-[480px] shadow-[0_8px_40px_rgba(32,32,28,0.08)]">
                <div className="flex items-center justify-between border-b border-[#F3EAD9] pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <img src="/assets/vital-logomark.svg" alt="vital logomark" className="w-5 h-5" />
                    <span className="text-xs font-bold text-[#20201C] lowercase">vital</span>
                    <span className="text-xs text-[#6B6459]">Dashboard</span>
                  </div>
                  <span className="text-xs">🔔</span>
                </div>

                {/* Score mini cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-[#F3EAD9] border border-[#E7DECC] rounded-xl p-3 text-center">
                    <p className="text-[9px] text-[#A79E8D] uppercase font-bold tracking-wider">Metabolic</p>
                    <h5 className="text-xl font-bold text-[#20201C] mt-1" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>87</h5>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#6FA97D] mt-1"></span>
                  </div>
                  <div className="bg-[#F3EAD9] border border-[#E7DECC] rounded-xl p-3 text-center">
                    <p className="text-[9px] text-[#A79E8D] uppercase font-bold tracking-wider">Hormonal</p>
                    <h5 className="text-xl font-bold text-[#20201C] mt-1" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>71</h5>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CDA24E] mt-1"></span>
                  </div>
                  <div className="bg-[#F3EAD9] border border-[#E7DECC] rounded-xl p-3 text-center">
                    <p className="text-[9px] text-[#A79E8D] uppercase font-bold tracking-wider">Inflammatory</p>
                    <h5 className="text-xl font-bold text-[#20201C] mt-1" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>92</h5>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#6FA97D] mt-1"></span>
                  </div>
                </div>

                {/* Chart placeholder */}
                <div className="mb-6 bg-[#F3EAD9]/40 border border-[#E7DECC] rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-[#A79E8D] uppercase tracking-wider">HbA1c — 12 Month Trend</span>
                    <span className="text-[10px] font-mono font-medium text-[#C2603C]">Target range reached</span>
                  </div>
                  <div className="flex items-end justify-between h-16 pt-2">
                    <div className="w-4 bg-[#E7DECC] h-[90%] rounded-t-sm" />
                    <div className="w-4 bg-[#E7DECC] h-[85%] rounded-t-sm" />
                    <div className="w-4 bg-[#E7DECC] h-[75%] rounded-t-sm" />
                    <div className="w-4 bg-[#E7DECC] h-[70%] rounded-t-sm" />
                    <div className="w-4 bg-[#E7DECC] h-[65%] rounded-t-sm" />
                    <div className="w-4 bg-[#E7DECC] h-[60%] rounded-t-sm" />
                    <div className="w-4 bg-[#E7DECC] h-[55%] rounded-t-sm" />
                    <div className="w-4 bg-[#E7DECC] h-[50%] rounded-t-sm" />
                    <div className="w-4 bg-[#E7DECC] h-[48%] rounded-t-sm" />
                    <div className="w-4 bg-[#E7DECC] h-[45%] rounded-t-sm" />
                    <div className="w-4 bg-[#C2603C] h-[40%] rounded-t-sm" />
                  </div>
                  <div className="flex justify-between text-[9px] text-[#A79E8D] font-medium mt-1 uppercase">
                    <span>Jan</span>
                    <span>Jun</span>
                    <span>Dec</span>
                  </div>
                </div>

                {/* Biomarker details inside mockup */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#F3EAD9]">
                    <span className="text-[#6B6459]">Fasting Glucose</span>
                    <span className="font-mono text-[#20201C] flex items-center gap-1.5">89 mg/dL <span className="w-1.5 h-1.5 rounded-full bg-[#6FA97D]"></span></span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F3EAD9]">
                    <span className="text-[#6B6459]">Free Testosterone</span>
                    <span className="font-mono text-[#20201C] flex items-center gap-1.5">14.2 pg/mL <span className="w-1.5 h-1.5 rounded-full bg-[#CDA24E]"></span></span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F3EAD9]">
                    <span className="text-[#6B6459]">Vitamin D3</span>
                    <span className="font-mono text-[#20201C] flex items-center gap-1.5">18 ng/mL <span className="w-1.5 h-1.5 rounded-full bg-[#C2603C]"></span></span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#6B6459]">ApoB</span>
                    <span className="font-mono text-[#20201C] flex items-center gap-1.5">72 mg/dL <span className="w-1.5 h-1.5 rounded-full bg-[#6FA97D]"></span></span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 5 - How It Works */}
      <section className="bg-[#F3EAD9] border-t border-[#E7DECC] py-24 px-6 md:px-10 text-center">
        <div ref={r3.ref} className={`max-w-4xl mx-auto transition-all duration-700 ease-out ${r3.revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A79E8D] mb-3">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-[-0.02em] text-[#20201C] mb-16" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
            Two visits. A year of clarity.
          </h2>

          {/* Steps Horizontal Timeline */}
          <div className="relative">
            {/* Background horizontal line */}
            <div className="absolute top-1.5 left-0 right-0 h-0.5 bg-[#E7DECC] z-0 hidden md:block" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              
              {/* Step 1 */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-4.5 h-4.5 rounded-full bg-[#C2603C] border-4 border-[#F3EAD9] z-20 mb-6 shadow-sm shadow-[#C2603C]" />
                <span className="text-[10px] font-bold text-[#C2603C] uppercase tracking-widest">SUBSCRIBE</span>
                <span className="text-xs text-[#A79E8D] mt-1">Month 0</span>
                <h4 className="text-base font-bold text-[#20201C] mt-3" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>Choose your plan</h4>
                <p className="text-xs text-[#6B6459] mt-2 leading-relaxed max-w-[240px]">
                  Choose basic or premium depending on biomarker depth. Complete your initial lifestyle audit and book.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-4.5 h-4.5 rounded-full bg-white border-2 border-[#E7DECC] z-20 mb-6" />
                <span className="text-[10px] font-bold text-[#A79E8D] uppercase tracking-widest">VISIT 1</span>
                <span className="text-xs text-[#A79E8D] mt-1">Month 1</span>
                <h4 className="text-base font-bold text-[#20201C] mt-3" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>Annual panel draw</h4>
                <p className="text-xs text-[#6B6459] mt-2 leading-relaxed max-w-[240px]">
                  80+ biomarkers drawn at home or at one of our luxury clinical hubs. Clean results visualized in 48 hours.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-4.5 h-4.5 rounded-full bg-white border-2 border-[#E7DECC] z-20 mb-6" />
                <span className="text-[10px] font-bold text-[#A79E8D] uppercase tracking-widest">VISIT 2</span>
                <span className="text-xs text-[#A79E8D] mt-1">Month 7</span>
                <h4 className="text-base font-bold text-[#20201C] mt-3" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>Mid-year optimization</h4>
                <p className="text-xs text-[#6B6459] mt-2 leading-relaxed max-w-[240px]">
                  Tracks changes, re-assess core metrics, adjust nutrition profiles, and optimize your ongoing trajectory.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 - Biomarker Categories */}
      <section id="science" className="bg-[#FBF6EC] border-t border-[#E7DECC] py-24 px-6 md:px-10">
        <div ref={r4.ref} className={`max-w-7xl mx-auto transition-all duration-700 ease-out ${r4.revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A79E8D] mb-3">What We Test</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-[-0.02em] leading-tight text-[#20201C] mb-8" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
            80+ biomarkers across<br/>8 health categories.
          </h2>
          <p className="text-xs text-[#6B6459] max-w-[480px] mb-12 leading-relaxed">
            Click on any health category card below to expand and view the exact biomarkers audited inside each panel.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            
            {testCategoriesData.map((cat, idx) => {
              const isExpanded = expandedCardIdx === idx;
              return (
                <div 
                  key={idx}
                  onClick={() => setExpandedCardIdx(isExpanded ? null : idx)}
                  className={`bg-white border border-[#E7DECC] rounded-xl p-5 border-l-4 ${cat.borderColor} cursor-pointer hover:shadow-md transition-all duration-300 ${
                    isExpanded ? 'ring-1 ring-[#C2603C] scale-[1.01]' : 'hover:-translate-y-1'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-[#20201C]">{cat.title}</h4>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium bg-[#F3EAD9] text-[#6B6459] px-2.5 py-0.5 rounded-full whitespace-nowrap">{cat.count}</span>
                      <span className={`text-xs text-[#A79E8D] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                  </div>

                  {/* Expandable Biomarker List (Shows when clicked) */}
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    isExpanded ? 'max-h-[380px] mt-4 pt-4 border-t border-[#F3EAD9] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                  }`}>
                    <span className="text-[10px] font-bold text-[#A79E8D] uppercase tracking-wider block mb-2">Audited Markers:</span>
                    <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {cat.markers.map((marker, mIdx) => (
                        <div key={mIdx} className="text-[11px] text-[#20201C] bg-[#FBF6EC] px-2.5 py-1.5 rounded border border-[#E7DECC]/40 flex items-center gap-1.5">
                          <span>{marker}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </section>

      {/* SECTION 7 - Pricing */}
      <section id="pricing" className="bg-[#F3EAD9] border-t border-[#E7DECC] py-24 px-6 md:px-10">
        <div ref={r5.ref} className={`max-w-7xl mx-auto transition-all duration-700 ease-out ${r5.revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="text-center mb-12">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A79E8D] mb-3">Membership</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-[-0.02em] text-[#20201C]" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
              Serious health, accessible pricing.
            </h2>

            {/* Pricing toggle */}
            <div className="mt-8 inline-flex items-center bg-[#FBF6EC] border border-[#E7DECC] rounded-xl p-1 gap-1">
              <button 
                onClick={() => setPricingToggle('monthly')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  pricingPeriod === 'monthly' ? 'bg-white text-[#C2603C] shadow-sm' : 'text-[#6B6459] bg-transparent'
                }`}
              >
                Pay Monthly
              </button>
              <button 
                onClick={() => setPricingToggle('annual')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  pricingPeriod === 'annual' ? 'bg-white text-[#C2603C] shadow-sm' : 'text-[#6B6459] bg-transparent'
                }`}
              >
                Pay Annually <span className="text-[#6FA97D] text-[10px] font-bold font-mono ml-1">Save 10%</span>
              </button>
            </div>
          </div>

          {/* Pricing cards side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
            
            {/* Basic card */}
            <div className="bg-white border border-[#E7DECC] rounded-xl p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A79E8D]">BASIC</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#20201C]" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>15,000 EGP</span>
                  <span className="text-xs text-[#6B6459]">/ year</span>
                </div>

                {/* Dynamic Payment Box */}
                <div className="bg-[#F3EAD9] rounded-xl p-4 my-6 border border-[#E7DECC]/50 text-left">
                  {pricingPeriod === 'monthly' ? (
                    <div>
                      <p className="text-sm font-bold text-[#20201C]">4,000 EGP today</p>
                      <p className="text-xs text-[#6B6459] mt-1">then 1,000 EGP / month for 11 months</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-[#20201C]">13,500 EGP — one payment</p>
                      <p className="text-xs text-[#3E7A53] font-semibold mt-1 flex items-center gap-1">
                        ✓ Save 1,500 EGP (10% Off)
                      </p>
                    </div>
                  )}
                  
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-[#E7DECC]"></div>
                    <span className="flex-shrink mx-2 text-[10px] text-[#A79E8D] uppercase font-bold">or</span>
                    <div className="flex-grow border-t border-[#E7DECC]"></div>
                  </div>

                  <p className="text-[11px] text-[#6B6459] leading-relaxed">
                    Flexible options processed in collaboration with local partner systems.
                  </p>
                </div>

                <ul className="space-y-3.5 mb-8">
                  <li className="flex items-start gap-3 text-xs text-[#6B6459]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6FA97D]/10 text-[#6FA97D] text-[10px] font-bold">✓</span>
                    <span>31 biomarkers &middot; annual panel</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-[#6B6459]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6FA97D]/10 text-[#6FA97D] text-[10px] font-bold">✓</span>
                    <span>24 biomarkers &middot; mid-year retest</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-[#6B6459]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6FA97D]/10 text-[#6FA97D] text-[10px] font-bold">✓</span>
                    <span>2 laboratory clinic visits per year</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-[#6B6459]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6FA97D]/10 text-[#6FA97D] text-[10px] font-bold">✓</span>
                    <span>Full historical health dashboard</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-[#6B6459]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6FA97D]/10 text-[#6FA97D] text-[10px] font-bold">✓</span>
                    <span>Longitudinal tracking and optimal profiling</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-[#6B6459]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6FA97D]/10 text-[#6FA97D] text-[10px] font-bold">✓</span>
                    <span>Educational plain-language insights</span>
                  </li>
                </ul>
              </div>

              <a href="#closing-cta" className="w-full text-center py-3.5 rounded-lg border border-[#20201C] text-[#20201C] font-semibold text-sm hover:bg-[#20201C] hover:text-white transition-colors">
                Choose Basic
              </a>
            </div>

            {/* Premium Featured card */}
            <div className="bg-white border-2 border-[#C2603C] rounded-xl p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative">
              <div className="absolute top-0 right-8 -translate-y-1/2">
                <span className="text-[10px] font-bold tracking-wider uppercase bg-[#C2603C] text-[#FBF6EC] px-3.5 py-1.5 rounded-full shadow-sm">
                  MOST POPULAR
                </span>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#C2603C]">PREMIUM</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#20201C]" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>20,000 EGP</span>
                  <span className="text-xs text-[#6B6459]">/ year</span>
                </div>

                {/* Dynamic Payment Box */}
                <div className="bg-[#F3EAD9] rounded-xl p-4 my-6 border border-[#E7DECC]/50 text-left">
                  {pricingPeriod === 'monthly' ? (
                    <div>
                      <p className="text-sm font-bold text-[#20201C]">4,000 EGP today</p>
                      <p className="text-xs text-[#6B6459] mt-1">then 1,400 EGP / month for 11 months</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-[#20201C]">18,000 EGP — one payment</p>
                      <p className="text-xs text-[#3E7A53] font-semibold mt-1 flex items-center gap-1">
                        ✓ Save 2,000 EGP (10% Off)
                      </p>
                    </div>
                  )}
                  
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-[#E7DECC]"></div>
                    <span className="flex-shrink mx-2 text-[10px] text-[#A79E8D] uppercase font-bold">or</span>
                    <div className="flex-grow border-t border-[#E7DECC]"></div>
                  </div>

                  <p className="text-[11px] text-[#6B6459] leading-relaxed">
                    Flexible options processed in collaboration with local partner systems.
                  </p>
                </div>

                <ul className="space-y-3.5 mb-8">
                  <li className="flex items-start gap-3 text-xs text-[#6B6459]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6FA97D]/10 text-[#6FA97D] text-[10px] font-bold">✓</span>
                    <span>58 biomarkers &middot; annual panel</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-[#6B6459]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6FA97D]/10 text-[#6FA97D] text-[10px] font-bold">✓</span>
                    <span>32 biomarkers &middot; mid-year retest</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-[#6B6459]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6FA97D]/10 text-[#6FA97D] text-[10px] font-bold">✓</span>
                    <span>2 laboratory clinic visits per year</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-[#C2603C]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C2603C]/10 text-[#C2603C] text-[10px] font-bold">✓</span>
                    <span className="font-semibold">Advanced: ApoB, Cortisol, Homocysteine</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-[#6B6459]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6FA97D]/10 text-[#6FA97D] text-[10px] font-bold">✓</span>
                    <span>Tumor markers and autoimmune screenings</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-[#6B6459]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6FA97D]/10 text-[#6FA97D] text-[10px] font-bold">✓</span>
                    <span>Hormonal deep-dive add-on packages ready</span>
                  </li>
                </ul>
              </div>

              <a href="#closing-cta" className="w-full text-center py-3.5 rounded-lg bg-[#C2603C] text-[#FBF6EC] font-semibold text-sm hover:bg-[#A34E30] transition-colors shadow-sm">
                Choose Premium
              </a>
            </div>

          </div>



        </div>
      </section>

      {/* SECTION 8 - Lab Partners */}
      <section className="bg-[#FBF6EC] border-t border-[#E7DECC] py-24 px-6 md:px-10">
        <div ref={r6.ref} className={`max-w-7xl mx-auto transition-all duration-700 ease-out ${r6.revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="max-w-xl mb-12">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A79E8D] mb-3">Laboratory Partners</p>
            <p className="text-sm text-[#6B6459] leading-relaxed mt-2">
              All health samples are processed exclusively through certified EDA-licensed diagnostic laboratories - the identical gold standard facilities trusted by hospitals and top clinical teams in Egypt.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border border-[#E7DECC] rounded-xl p-5 flex items-center gap-4 hover:border-[#C2603C] transition-all">
              <div className="w-10 h-10 bg-[#F3EAD9] border border-[#E7DECC] rounded-lg flex items-center justify-center font-bold text-xs text-[#C2603C]">AB</div>
              <div>
                <h5 className="text-sm font-semibold text-[#20201C]">Al Borg</h5>
                <p className="text-[11px] text-[#6B6459] mt-0.5">National Lab Network</p>
              </div>
            </div>

            <div className="bg-white border border-[#E7DECC] rounded-xl p-5 flex items-center gap-4 hover:border-[#C2603C] transition-all">
              <div className="w-10 h-10 bg-[#F3EAD9] border border-[#E7DECC] rounded-lg flex items-center justify-center font-bold text-xs text-[#C2603C]">AM</div>
              <div>
                <h5 className="text-sm font-semibold text-[#20201C]">Al Mokhtabar</h5>
                <p className="text-[11px] text-[#6B6459] mt-0.5">Diagnostic Network</p>
              </div>
            </div>

            <div className="bg-white border border-[#E7DECC] rounded-xl p-5 flex items-center gap-4 hover:border-[#C2603C] transition-all">
              <div className="w-10 h-10 bg-[#F3EAD9] border border-[#E7DECC] rounded-lg flex items-center justify-center font-bold text-xs text-[#C2603C]">AL</div>
              <div>
                <h5 className="text-sm font-semibold text-[#20201C]">Alfa Labs</h5>
                <p className="text-[11px] text-[#6B6459] mt-0.5">Clinical Diagnostics</p>
              </div>
            </div>

            <div className="bg-white border border-[#E7DECC] rounded-xl p-5 flex items-center gap-4 hover:border-[#C2603C] transition-all">
              <div className="w-10 h-10 bg-[#F3EAD9] border border-[#E7DECC] rounded-lg flex items-center justify-center font-bold text-xs text-[#C2603C]">CS</div>
              <div>
                <h5 className="text-sm font-semibold text-[#20201C]">Cairo Scan</h5>
                <p className="text-[11px] text-[#6B6459] mt-0.5">Imaging &amp; Laboratory</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 9 - Trust & Science Columns */}
      <section className="bg-[#F3EAD9] border-t border-[#E7DECC] py-20 px-6 md:px-10">
        <div ref={r7.ref} className={`max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 transition-all duration-700 ease-out ${r7.revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          
          <div className="flex flex-col items-start">
            <span className="w-8 h-[2px] bg-[#C2603C] mb-4"></span>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A79E8D]">Certified Labs</p>
            <h4 className="text-base font-semibold text-[#20201C] mt-2">100% Licensed Diagnostics</h4>
            <p className="text-xs text-[#6B6459] mt-2 leading-relaxed">
              All biological tests are routed and processed exclusively in fully EDA-licensed labs, keeping reliability and clinical rigor completely paramount.
            </p>
          </div>

          <div className="flex flex-col items-start">
            <span className="w-8 h-[2px] bg-[#C2603C] mb-4"></span>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A79E8D]">Optimal Ranges</p>
            <h4 className="text-base font-semibold text-[#20201C] mt-2">Functional Medicine Standard</h4>
            <p className="text-xs text-[#6B6459] mt-2 leading-relaxed">
              We look at functional longevity metrics instead of wide public normals, flagging early shifts while they remain easily reversible.
            </p>
          </div>

          <div className="flex flex-col items-start">
            <span className="w-8 h-[2px] bg-[#C2603C] mb-4"></span>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A79E8D]">Health Tracking</p>
            <h4 className="text-base font-semibold text-[#20201C] mt-2">Longitudinal Analysis</h4>
            <p className="text-xs text-[#6B6459] mt-2 leading-relaxed">
              Every draw stacks in your database. See exactly what impact lifestyle choices make, keeping your future trajectory clearly positive.
            </p>
          </div>

        </div>
      </section>

      {/* SECTION 10 - Closing CTA */}
      <section id="closing-cta" className="bg-[#FBF6EC] border-t border-[#E7DECC] py-28 px-6 md:px-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(194,96,60,0.03), transparent)' }} />
        
        <div ref={r8.ref} className={`max-w-3xl mx-auto relative z-10 transition-all duration-700 ease-out ${r8.revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A79E8D] mb-3">vital &middot; EGYPT</p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-[#20201C] leading-none mb-6" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
            Become the operating system<br/>for your health.
          </h2>
          <p className="text-sm md:text-base text-[#6B6459] leading-relaxed max-w-[460px] mx-auto mb-10">
            Join thousands of health-conscious Egyptians who aren't waiting for something to go wrong.
          </p>

          <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3 max-w-[480px] mx-auto mb-8">
            <input
              type="email"
              required
              placeholder="Enter your email to apply"
              value={waitlistEmail}
              onChange={(e) => setWaitlistEmail(e.target.value)}
              className="flex-1 px-4 py-3 border border-[#E7DECC] bg-white text-[#20201C] placeholder-[#A79E8D] rounded-lg focus:outline-none focus:border-[#C2603C] text-sm shadow-sm"
            />
            <button 
              type="submit" 
              disabled={submitting}
              className="bg-[#C2603C] text-[#FBF6EC] font-semibold text-sm px-8 py-3.5 rounded-lg hover:bg-[#A34E30] active:scale-[0.98] shadow-sm transition-all"
            >
              {submitting ? "Joining..." : "Start Your Membership \u2192"}
            </button>
          </form>

          {waitlistSuccess && (
            <p className="text-sm text-[#3E7A53] font-medium mb-6 bg-[#6FA97D]/10 px-4 py-2.5 rounded-lg border border-[#6FA97D]/30 inline-block">
              Thank you. You've been added to the preventive health waitlist.
            </p>
          )}

          <div className="mt-4">
            <a href="#pricing" className="text-xs font-semibold text-[#C2603C] hover:text-[#A34E30] underline transition-all">
              Already a member? Sign in &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 11 - Footer */}
      <footer className="bg-[#F3EAD9] border-t border-[#E7DECC] py-8 px-6 md:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-[#A79E8D]">
          
          {/* Left info */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <img src="/assets/vital-logomark.svg" alt="vital logomark" className="w-6 h-6" />
              <span className="text-lg font-extrabold tracking-tight text-[#20201C] lowercase" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>vital</span>
            </div>
            <p>Egypt &middot; Preventive Health Intelligence</p>
          </div>

          {/* Center Links */}
          <div className="flex gap-6 font-medium">
            <a href="#" className="hover:text-[#20201C] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#20201C] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#20201C] transition-colors">Contact Us</a>
          </div>

          {/* Right copyright */}
          <p className="text-center md:text-right font-mono">
            &copy; 2026 vital. All rights reserved.
          </p>

        </div>
      </footer>

    </div>
  );
}








