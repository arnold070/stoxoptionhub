import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Shield, Globe, TrendingUp, BookOpen, Users, Zap, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about StoxOptionHub — our mission, vision, and commitment to transparent, education-first copy trading and investment mentorship worldwide.",
};

const values = [
  { icon: Shield, title: "Transparency First", desc: "Every financial action is audited and traceable. Deposits are manually verified, and all investment activity is logged in an immutable ledger." },
  { icon: BookOpen, title: "Education-Driven", desc: "We believe informed investors make better decisions. Mentorship programs are built around real skill development, not marketing promises." },
  { icon: Globe, title: "Globally Accessible", desc: "Designed to serve investors across 40+ countries with multi-currency deposit support and a compliance-focused approach." },
  { icon: TrendingUp, title: "Strategy-Oriented", desc: "Investment plans are structured around defined strategies and durations, not speculative trends. Every plan has clear parameters." },
  { icon: Users, title: "Community-Centered", desc: "From mentorship cohorts to learning communities, StoxOptionHub invests in building a collaborative environment where traders help traders." },
  { icon: Zap, title: "Institutional Standards", desc: "Built to institutional-grade standards — secure wallet architecture, admin-controlled approvals, and full audit trails throughout." },
];

const team = [
  { name: "Marcus Reid", role: "CEO & Co-Founder", initials: "MR", color: "from-[#f0b429] to-[#e0a424]", bio: "15 years in institutional trading. Former derivatives desk lead at two tier-1 banks." },
  { name: "Aisha Bello", role: "CTO & Co-Founder", initials: "AB", color: "from-[#6366f1] to-[#4f46e5]", bio: "Fintech infrastructure architect. Previously led platform engineering at a NASDAQ-listed brokerage." },
  { name: "James Park", role: "Head of Compliance", initials: "JP", color: "from-[#22c55e] to-[#16a34a]", bio: "10 years in financial compliance and AML. Ensures every process meets international standards." },
  { name: "Sofia Reyes", role: "Head of Education", initials: "SR", color: "from-[#f97316] to-[#ea580c]", bio: "Certified financial educator with experience building curriculum for retail investors across 3 continents." },
];

const milestones = [
  { year: "2021", event: "Platform founded with a focus on transparent copy trading infrastructure." },
  { year: "2022", event: "Launched structured investment plans and manual deposit verification system." },
  { year: "2023", event: "Expanded to 40+ countries. Mentorship program launched with 6 learning tracks." },
  { year: "2024", event: "Crossed 5,000 active members. Full audit ledger and admin compliance suite deployed." },
];

export default function AboutPage() {
  return (
    <div className="bg-[#0a0a0a] text-white">

      {/* ── Hero ── */}
      <section className="relative py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(240,180,41,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(240,180,41,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#f0b429]/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f0b429]/10 border border-[#f0b429]/20 rounded-full mb-6">
            <Zap size={11} className="text-[#f0b429]" />
            <span className="text-[11px] text-[#f0b429] font-semibold uppercase tracking-wider">Our Story</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight mb-6">
            Building a Better Way to{" "}
            <span className="text-[#f0b429]">Invest & Learn</span>
          </h1>
          <p className="text-[16px] sm:text-[18px] text-[#888] leading-relaxed max-w-2xl mx-auto mb-10">
            StoxOptionHub was founded on the belief that structured copy trading and professional mentorship — built on genuine transparency — can make systematic investing accessible to a global audience.
          </p>

          {/* Hero stats row */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {[
              { value: "5,000+", label: "Active Members" },
              { value: "40+", label: "Countries" },
              { value: "2021", label: "Founded" },
              { value: "99.8%", label: "Uptime" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">{value}</div>
                <div className="text-[11px] text-[#555] uppercase tracking-wider mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d] border-y border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-8 hover:border-[#f0b429]/15 transition-all group">
            <div className="w-10 h-10 bg-[#f0b429]/10 group-hover:bg-[#f0b429]/15 rounded-xl flex items-center justify-center mb-5 transition-colors">
              <TrendingUp size={18} className="text-[#f0b429]" />
            </div>
            <h2 className="text-[22px] font-bold text-white mb-4">Our Mission</h2>
            <p className="text-[14px] text-[#888] leading-relaxed">
              To provide a transparent, compliant, and education-first investment platform that connects serious investors with structured copy trading strategies and expert mentorship — without misleading promises or guaranteed return claims.
            </p>
            <p className="text-[13px] text-[#555] mt-4 leading-relaxed">
              We exist to create a financial platform where investor protection, operational transparency, and genuine skill development are non-negotiable.
            </p>
          </div>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-8 hover:border-[#f0b429]/15 transition-all group">
            <div className="w-10 h-10 bg-[#f0b429]/10 group-hover:bg-[#f0b429]/15 rounded-xl flex items-center justify-center mb-5 transition-colors">
              <Globe size={18} className="text-[#f0b429]" />
            </div>
            <h2 className="text-[22px] font-bold text-white mb-4">Our Vision</h2>
            <p className="text-[14px] text-[#888] leading-relaxed">
              To become the trusted global platform for copy trading and investment education — serving investors across all experience levels, in all markets, with the same institutional-grade tools previously reserved for professional traders.
            </p>
            <p className="text-[13px] text-[#555] mt-4 leading-relaxed">
              A world where access to structured investment infrastructure and professional market education is not limited by geography or capital size.
            </p>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full mb-4">
              <Shield size={11} className="text-[#f0b429]" />
              <span className="text-[11px] text-[#888] font-medium uppercase tracking-wider">Core Values</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">What We Stand For</h2>
            <p className="text-[15px] text-[#555] max-w-xl mx-auto">
              These principles guide every product decision, compliance process, and investor interaction on the platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 hover:border-[#f0b429]/15 transition-all group">
                <div className="w-10 h-10 bg-[#1a1a1a] group-hover:bg-[#f0b429]/10 border border-[#2a2a2a] rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <Icon size={17} className="text-[#555] group-hover:text-[#f0b429] transition-colors" />
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{title}</h3>
                <p className="text-[13px] text-[#555] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Milestones ── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d] border-y border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Our Journey</h2>
            <p className="text-[15px] text-[#555]">From a single idea to a global investment platform.</p>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[11px] sm:left-1/2 sm:-translate-x-px top-0 bottom-0 w-px bg-[#1e1e1e]" aria-hidden="true" />
            <div className="space-y-8">
              {milestones.map(({ year, event }, i) => (
                <div key={year} className={`relative flex items-start gap-6 ${i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"}`}>
                  {/* Dot */}
                  <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 w-6 h-6 rounded-full bg-[#0a0a0a] border-2 border-[#f0b429] flex items-center justify-center shrink-0 mt-1 z-10">
                    <div className="w-2 h-2 rounded-full bg-[#f0b429]" />
                  </div>
                  {/* Content */}
                  <div className={`pl-10 sm:pl-0 sm:w-[calc(50%-24px)] ${i % 2 === 0 ? "sm:pr-10" : "sm:pl-10"}`}>
                    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 hover:border-[#2a2a2a] transition-all">
                      <div className="text-[#f0b429] text-[13px] font-bold mb-1">{year}</div>
                      <p className="text-[13px] text-[#888] leading-relaxed">{event}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full mb-4">
              <Users size={11} className="text-[#f0b429]" />
              <span className="text-[11px] text-[#888] font-medium uppercase tracking-wider">Leadership</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">The Team Behind the Platform</h2>
            <p className="text-[15px] text-[#555] max-w-xl mx-auto">
              Built by experienced traders, technologists, and compliance professionals who understand what institutional-grade infrastructure actually means.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {team.map(({ name, role, initials, color, bio }) => (
              <div key={name} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 hover:border-[#2a2a2a] transition-all text-center group">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-[18px] font-bold text-white mx-auto mb-4 group-hover:scale-105 transition-transform`}>
                  {initials}
                </div>
                <div className="text-[15px] font-bold text-white mb-1">{name}</div>
                <div className="text-[11px] text-[#f0b429] font-semibold uppercase tracking-wider mb-3">{role}</div>
                <p className="text-[12px] text-[#555] leading-relaxed">{bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Copy Trading Philosophy ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d] border-y border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Our Copy Trading Philosophy</h2>
          </div>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-8 sm:p-10 space-y-5 text-[14px] text-[#888] leading-relaxed">
            <p>
              Copy trading at StoxOptionHub is not a passive wealth-generation scheme. It is a structured system where your capital is allocated to defined strategies managed by experienced traders, with a fixed duration, transparent parameters, and market-dependent outcomes.
            </p>
            <p>
              Every copy trading plan on the platform has a clearly stated duration, strategy type, risk level, and minimum investment requirement. We make no claims about returns. Strategy performance is inherently tied to market conditions, and all investors should review the risk disclosure before participating.
            </p>
            <ul className="space-y-2">
              {[
                "No guaranteed returns — ever",
                "All plans clearly display risk level and duration",
                "Every deposit manually verified before crediting",
                "Full audit trail for every financial action",
              ].map((pt) => (
                <li key={pt} className="flex items-center gap-3 text-[13px]">
                  <CheckCircle size={14} className="text-[#f0b429] shrink-0" />
                  {pt}
                </li>
              ))}
            </ul>
            <div className="p-4 bg-[#f0b429]/5 border border-[#f0b429]/15 rounded-xl">
              <p className="text-[13px] text-[#888]">
                <span className="text-[#f0b429] font-semibold">StoxOptionHub Principle:</span> We will always be honest about market risk. Returns depend on market performance. Capital is at risk. We do not manufacture return projections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-[14px] text-[#555] mb-8 leading-relaxed">
            Join StoxOptionHub and access structured copy trading plans, professional mentorship, and a transparent investment ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#f0b429] hover:bg-[#e0a424] text-black font-bold text-[14px] rounded-xl transition-all hover:shadow-[0_0_20px_rgba(240,180,41,0.3)]"
            >
              Create Account <ArrowRight size={14} />
            </Link>
            <Link
              href="/investment-plans"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-[#2a2a2a] hover:border-[#f0b429]/30 text-white font-semibold text-[14px] rounded-xl transition-all"
            >
              View Plans
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
