import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Users, BarChart2, Shield, Video, Globe, CheckCircle, Zap, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Mentorship Programs",
  description:
    "Join StoxOptionHub's structured mentorship programs. Learn technical analysis, risk management, and portfolio building from experienced professionals. Educational programs only.",
};

const tracks = [
  {
    level: "Beginner",
    badge: "Foundation",
    badgeColor: "text-[#22c55e]",
    badgeBg: "bg-[#22c55e]/10 border-[#22c55e]/20",
    modules: 8,
    duration: "4 weeks",
    topics: [
      "Introduction to financial markets",
      "Reading candlestick charts and timeframes",
      "Understanding risk vs reward",
      "Order types and execution basics",
      "Introduction to crypto and forex markets",
    ],
    desc: "A structured foundation for investors with little or no prior trading knowledge.",
  },
  {
    level: "Intermediate",
    badge: "Technical Analysis",
    badgeColor: "text-[#f0b429]",
    badgeBg: "bg-[#f0b429]/10 border-[#f0b429]/20",
    modules: 12,
    duration: "6 weeks",
    topics: [
      "Technical indicators (RSI, MACD, Bollinger Bands)",
      "Support and resistance identification",
      "Trend analysis and market structure",
      "Volume analysis and confirmation",
      "Building a trading system framework",
    ],
    desc: "Deep-dive into technical analysis methodology used by professional traders.",
    featured: true,
  },
  {
    level: "Advanced",
    badge: "Risk & Portfolio",
    badgeColor: "text-[#ef4444]",
    badgeBg: "bg-[#ef4444]/10 border-[#ef4444]/20",
    modules: 10,
    duration: "5 weeks",
    topics: [
      "Position sizing and capital allocation",
      "Risk management frameworks (1R, Kelly, Fixed fractional)",
      "Portfolio diversification across asset classes",
      "Drawdown management and recovery strategies",
      "Building long-term sustainable trading systems",
    ],
    desc: "Advanced frameworks for managing capital, risk, and building systematic portfolios.",
  },
];

const mentors = [
  { name: "David Osei", role: "Technical Analysis Lead", initials: "DO", color: "from-[#f0b429] to-[#e0a424]", exp: "12 yrs", spec: "Price action & momentum" },
  { name: "Priya Nair", role: "Risk Management Trainer", initials: "PN", color: "from-[#22c55e] to-[#16a34a]", exp: "9 yrs", spec: "Capital preservation & drawdown control" },
  { name: "Luca Ferrari", role: "Forex & Macro Analyst", initials: "LF", color: "from-[#6366f1] to-[#4f46e5]", exp: "14 yrs", spec: "Macro-driven forex strategy" },
  { name: "Nadia Okonkwo", role: "Crypto Markets Educator", initials: "NO", color: "from-[#f97316] to-[#ea580c]", exp: "7 yrs", spec: "Crypto market structure & DeFi" },
];

const timeline = [
  { week: "Week 1–2", title: "Foundations", desc: "Markets, terminology, chart types, and order basics." },
  { week: "Week 3–4", title: "Technical Framework", desc: "Indicators, patterns, support/resistance, and trend identification." },
  { week: "Week 5–8", title: "Strategy Building", desc: "Combining tools into a systematic, rule-based trading approach." },
  { week: "Week 9–10", title: "Risk Management", desc: "Position sizing, stop placement, and capital protection frameworks." },
  { week: "Week 11+", title: "Live Application", desc: "Real-market analysis, Q&A sessions, and community review." },
];

const sessionTypes = [
  { icon: Video, title: "Live Webinars", freq: "Weekly", desc: "Real-time market sessions with expert traders. Q&A included." },
  { icon: BarChart2, title: "Market Analysis", freq: "Bi-weekly", desc: "In-depth breakdowns of macro conditions and technical setups." },
  { icon: Users, title: "Cohort Groups", freq: "Ongoing", desc: "Peer learning communities organized by experience level." },
  { icon: BookOpen, title: "Recorded Library", freq: "Always available", desc: "On-demand access to all past sessions and materials." },
  { icon: Shield, title: "Risk Training", freq: "Monthly", desc: "Dedicated sessions focused solely on capital preservation strategies." },
  { icon: Globe, title: "Global Discussions", freq: "Daily", desc: "Cross-timezone community discussion on market events." },
];

export default function MentorshipPage() {
  return (
    <div className="bg-[#0a0a0a] text-white">

      {/* ── Hero ── */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-[#1a1a1a]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(240,180,41,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(240,180,41,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#f0b429]/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f0b429]/10 border border-[#f0b429]/20 rounded-full mb-5">
            <BookOpen size={11} className="text-[#f0b429]" />
            <span className="text-[11px] text-[#f0b429] font-semibold uppercase tracking-wider">Education Platform</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight mb-5">
            Mentorship Programs —<br />
            <span className="text-[#f0b429]">Built for Real Skill</span>
          </h1>
          <p className="text-[16px] text-[#888] leading-relaxed mb-6 max-w-2xl mx-auto">
            Our mentorship system is a structured educational offering designed to develop genuine trading knowledge and risk management capability — not a signal service or guaranteed return scheme.
          </p>
          <div className="inline-flex items-center gap-2 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl mb-8">
            <Zap size={12} className="text-[#f0b429] shrink-0" />
            <p className="text-[12px] text-[#888]">Educational content only. Mentorship does not constitute financial advice or trading signals.</p>
          </div>

          {/* Hero stats */}
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { value: "2,400+", label: "Active Learners" },
              { value: "3", label: "Learning Levels" },
              { value: "8+", label: "Live Sessions / Month" },
              { value: "4", label: "Expert Mentors" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-[11px] text-[#555] uppercase tracking-wider mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Learning Tracks ── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full mb-4">
              <Award size={11} className="text-[#f0b429]" />
              <span className="text-[11px] text-[#888] font-medium uppercase tracking-wider">Curriculum</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Structured Learning Tracks</h2>
            <p className="text-[14px] text-[#555] max-w-xl mx-auto">
              Progress through a defined curriculum from foundational concepts to advanced systematic trading frameworks.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {tracks.map(({ level, badge, badgeColor, badgeBg, modules, duration, topics, desc, featured }) => (
              <div key={level} className={`relative rounded-2xl p-6 flex flex-col transition-all ${
                featured
                  ? "bg-[#111] border-2 border-[#f0b429]/40 shadow-[0_0_40px_rgba(240,180,41,0.07)]"
                  : "bg-[#111] border border-[#1e1e1e] hover:border-[#2a2a2a]"
              }`}>
                {featured && (
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-[#f0b429] text-black text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${badgeColor} ${badgeBg}`}>
                    {badge}
                  </div>
                  <div className="text-[11px] text-[#555]">{duration}</div>
                </div>
                <h3 className="text-[20px] font-bold text-white mb-1">{level} Track</h3>
                <p className="text-[12px] text-[#555] mb-3 leading-relaxed">{desc}</p>
                <div className="text-[11px] text-[#555] mb-4">
                  <span className="text-white font-semibold">{modules}</span> modules
                </div>
                <ul className="space-y-2 flex-1">
                  {topics.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-[12px] text-[#666]">
                      <CheckCircle size={12} className="text-[#f0b429] mt-0.5 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-6 w-full py-2.5 text-[13px] font-semibold rounded-xl text-center transition-all ${
                    featured
                      ? "bg-[#f0b429] hover:bg-[#e0a424] text-black"
                      : "bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-white"
                  }`}
                >
                  Enrol in {level} Track
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Learning Timeline ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d] border-y border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Your Learning Journey</h2>
            <p className="text-[14px] text-[#555]">A structured progression from beginner fundamentals to live market application.</p>
          </div>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-[#1e1e1e]" aria-hidden="true" />
            <div className="space-y-6">
              {timeline.map(({ week, title, desc }, i) => (
                <div key={week} className="relative flex gap-6 pl-14">
                  {/* Dot */}
                  <div className="absolute left-0 w-10 h-10 rounded-full bg-[#0a0a0a] border-2 border-[#f0b429] flex items-center justify-center text-[11px] font-bold text-[#f0b429] shrink-0 z-10">
                    {i + 1}
                  </div>
                  <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 flex-1 hover:border-[#2a2a2a] transition-all">
                    <div className="text-[11px] text-[#f0b429] font-semibold uppercase tracking-wider mb-1">{week}</div>
                    <div className="text-[14px] font-semibold text-white mb-1">{title}</div>
                    <p className="text-[12px] text-[#555] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Mentor Highlights ── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full mb-4">
              <Users size={11} className="text-[#f0b429]" />
              <span className="text-[11px] text-[#888] font-medium uppercase tracking-wider">Expert Mentors</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Learn From Experienced Professionals</h2>
            <p className="text-[14px] text-[#555] max-w-xl mx-auto">
              Our mentors are practitioners with real market experience — not theoretical instructors.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {mentors.map(({ name, role, initials, color, exp, spec }) => (
              <div key={name} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 hover:border-[#f0b429]/15 transition-all text-center group">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-[18px] font-bold text-white mx-auto mb-4 group-hover:scale-105 transition-transform`}>
                  {initials}
                </div>
                <div className="text-[15px] font-bold text-white mb-0.5">{name}</div>
                <div className="text-[11px] text-[#f0b429] font-semibold uppercase tracking-wider mb-3">{role}</div>
                <div className="text-[11px] text-[#555] mb-1">{exp} experience</div>
                <div className="text-[12px] text-[#666] leading-relaxed">{spec}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Session Types ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d] border-y border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Live & On-Demand Learning</h2>
            <p className="text-[14px] text-[#555] max-w-xl mx-auto">Multiple formats to fit your schedule and learning style.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessionTypes.map(({ icon: Icon, title, freq, desc }) => (
              <div key={title} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 hover:border-[#f0b429]/15 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 bg-[#f0b429]/10 group-hover:bg-[#f0b429]/15 rounded-lg flex items-center justify-center transition-colors">
                    <Icon size={15} className="text-[#f0b429]" />
                  </div>
                  <span className="text-[10px] text-[#555] font-medium uppercase tracking-wider">{freq}</span>
                </div>
                <h3 className="text-[14px] font-semibold text-white mb-1">{title}</h3>
                <p className="text-[12px] text-[#555] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(240,180,41,0.05)_0%,transparent_70%)] pointer-events-none" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white mb-4">Join the Mentorship Program</h2>
              <p className="text-[14px] text-[#888] leading-relaxed mb-4">
                Start your structured trading education journey today. Access beginner to advanced tracks, live sessions, and a global learning community.
              </p>
              <div className="p-3 bg-[#1a1a1a] rounded-lg mb-6 text-left">
                <p className="text-[11px] text-[#555] leading-relaxed">
                  <span className="text-white font-semibold">Educational Notice:</span> Mentorship content is for educational purposes only. It does not constitute financial advice, investment recommendations, or trading signals. Market trading involves risk. All investment and trading decisions are the sole responsibility of the investor.
                </p>
              </div>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#f0b429] hover:bg-[#e0a424] text-black font-bold text-[14px] rounded-xl transition-all hover:shadow-[0_0_20px_rgba(240,180,41,0.3)]"
              >
                Join Mentorship Program <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
