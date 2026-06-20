"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Kings Spark",
    location: "Lagos, Nigeria",
    role: "Retail Trader",
    initials: "KS",
    color: "from-[#f0b429] to-[#e0a424]",
    quote: "The structured copy trading plans gave me access to professional-grade strategies I couldn't build on my own. The deposit approval process is thorough and gives me real confidence in the platform's integrity.",
  },
  {
    name: "Sarah Chen",
    location: "Singapore",
    role: "Investment Analyst",
    initials: "SC",
    color: "from-[#22c55e] to-[#16a34a]",
    quote: "The mentorship program is genuinely educational. I've gone from understanding basic chart patterns to managing structured portfolio allocations. The compliance-focused approach is exactly what a serious platform needs.",
  },
  {
    name: "Marcus Webb",
    location: "London, UK",
    role: "Part-Time Trader",
    initials: "MW",
    color: "from-[#6366f1] to-[#4f46e5]",
    quote: "Transparent fee structure, professional dashboard, and a support team that actually responds. The investment lifecycle tracking is well-designed and keeps me informed without information overload.",
  },
  {
    name: "Amara Diallo",
    location: "Abidjan, Côte d'Ivoire",
    role: "Portfolio Enthusiast",
    initials: "AD",
    color: "from-[#f97316] to-[#ea580c]",
    quote: "As someone new to structured trading, the step-by-step wallet funding and plan selection process removed a lot of friction. The risk disclosures are honest, which builds real trust.",
  },
  {
    name: "Daniel Park",
    location: "Seoul, South Korea",
    role: "Crypto Investor",
    initials: "DP",
    color: "from-[#ec4899] to-[#db2777]",
    quote: "I appreciate that returns are presented honestly — no guaranteed profits, just real market-based strategies. That transparency is rare and it's exactly why I chose this platform over the alternatives.",
  },
  {
    name: "Fatima Al-Rashid",
    location: "Dubai, UAE",
    role: "Wealth Manager",
    initials: "FA",
    color: "from-[#14b8a6] to-[#0f766e]",
    quote: "For a professional managing client allocations, the audit trail and admin verification system is invaluable. Every transaction is accountable, which is the standard we expect for institutional-grade tools.",
  },
];

export default function TestimonialCarousel() {
  const [active, setActive] = useState(0);
  const total = TESTIMONIALS.length;

  const prev = () => setActive((a) => (a - 1 + total) % total);
  const next = () => setActive((a) => (a + 1) % total);

  // Show 3 at a time on desktop, 1 on mobile
  const visible = [
    TESTIMONIALS[active % total],
    TESTIMONIALS[(active + 1) % total],
    TESTIMONIALS[(active + 2) % total],
  ];

  return (
    <div>
      {/* Desktop: 3 cards */}
      <div className="hidden lg:grid grid-cols-3 gap-5 mb-8">
        {visible.map((t, i) => (
          <TestimonialCard key={t.name + i} t={t} highlight={i === 1} />
        ))}
      </div>

      {/* Mobile/tablet: 1 card */}
      <div className="lg:hidden mb-6">
        <TestimonialCard t={TESTIMONIALS[active]} highlight />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={prev}
          aria-label="Previous testimonial"
          className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#888] hover:text-white hover:border-[#3a3a3a] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex gap-1.5">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-[#f0b429]" : "w-1.5 bg-[#333]"
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          aria-label="Next testimonial"
          className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#888] hover:text-white hover:border-[#3a3a3a] transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function TestimonialCard({ t, highlight }: { t: typeof TESTIMONIALS[0]; highlight?: boolean }) {
  return (
    <div className={`relative bg-[#111] rounded-2xl p-6 border transition-all ${
      highlight ? "border-[#f0b429]/20 shadow-[0_0_30px_rgba(240,180,41,0.05)]" : "border-[#1e1e1e]"
    }`}>
      {/* Quote mark */}
      <div className="text-[48px] leading-none text-[#1e1e1e] font-serif mb-2 select-none" aria-hidden="true">&ldquo;</div>

      <p className="text-[13px] text-[#888] leading-relaxed mb-5">{t.quote}</p>

      <div className="flex items-center gap-3 pt-4 border-t border-[#1a1a1a]">
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
          {t.initials}
        </div>
        <div>
          <div className="text-[13px] font-semibold text-white">{t.name}</div>
          <div className="text-[11px] text-[#555]">{t.role} · {t.location}</div>
        </div>
      </div>
    </div>
  );
}
