"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, ArrowRight } from "lucide-react";

const categories = [
  {
    id: "account",
    label: "Account & Registration",
    questions: [
      {
        q: "How do I create an account?",
        a: "Click 'Get Started' or 'Register' from the navigation. Enter your name, email address, and a secure password. You will receive a verification email — click the link to activate your account and gain full platform access.",
      },
      {
        q: "Is registration free?",
        a: "Yes. Creating an account on StoxOptionHub is free. You only need funds to invest in a copy trading plan. There are no signup fees.",
      },
      {
        q: "What do I do if I forget my password?",
        a: "Click 'Forgot Password' on the login page. Enter your registered email and we will send a password reset link valid for one hour. If you don't see it, check your spam folder.",
      },
      {
        q: "Can I change my email address?",
        a: "Email address changes require contacting support@stoxoptionhub.com with verification of ownership of both the old and new addresses.",
      },
    ],
  },
  {
    id: "wallet",
    label: "Wallet & Deposits",
    questions: [
      {
        q: "How do I fund my wallet?",
        a: "Go to your Wallet page in the dashboard and click 'Request Deposit'. Enter the amount, the blockchain network you used, and the transaction hash (TXID) from your crypto transfer. Submit the form and await admin approval.",
      },
      {
        q: "What is the minimum deposit?",
        a: "The minimum deposit is $1,000 USDT equivalent. The platform supports major networks including Ethereum, Binance Smart Chain, and TRON for USDT transfers.",
      },
      {
        q: "How long does deposit approval take?",
        a: "Deposit review typically takes between 1 and 24 hours depending on network confirmation times and admin availability. You will receive a notification when your deposit is approved or if there is an issue.",
      },
      {
        q: "Why is my deposit still pending?",
        a: "Deposits require manual on-chain verification by our compliance team. If your deposit has been pending for more than 24 hours, contact support with your TXID and network details.",
      },
      {
        q: "Can my deposit be rejected?",
        a: "Yes. Deposits may be rejected if the transaction cannot be verified on-chain, if the amount doesn't match, or if there are compliance concerns. You will be notified with a reason.",
      },
    ],
  },
  {
    id: "investment",
    label: "Investment Plans",
    questions: [
      {
        q: "What is a copy trading investment plan?",
        a: "An investment plan is a structured product where your capital is allocated to a specific trading strategy managed by professionals for a defined duration (30–90 days). Returns at maturity are market-dependent.",
      },
      {
        q: "Are investment returns guaranteed?",
        a: "No. Returns are never guaranteed on StoxOptionHub. All investment plans are subject to market risk. The value of your investment can go up or down. Capital is at risk. Past strategy performance does not guarantee future results.",
      },
      {
        q: "Can I exit a plan before it matures?",
        a: "No. Once a plan is purchased, your investment capital is locked for the duration of that plan. You cannot exit early. Only invest capital you can commit for the full plan period.",
      },
      {
        q: "What happens at plan maturity?",
        a: "When a plan reaches its end date, the system automatically processes the maturity. Any returns (if the strategy performed positively in the market) are credited to your wallet. You receive a notification immediately.",
      },
      {
        q: "What is the minimum investment per plan?",
        a: "Minimum investment varies by plan: $1,000 for Starter Growth, $5,000 for Balanced Horizon, $10,000 for Alpha Momentum, and $20,000 for Institutional Edge. Check the Investment Plans page for current details.",
      },
    ],
  },
  {
    id: "copy-trading",
    label: "Copy Trading",
    questions: [
      {
        q: "What does 'copy trading' mean on StoxOptionHub?",
        a: "Copy trading means your capital is allocated to strategies managed by professional traders. The strategy's market activity applies to your position. You don't trade manually — your investment follows the strategy's execution.",
      },
      {
        q: "Who manages the trading strategies?",
        a: "Strategies are managed by experienced professional traders with defined frameworks and risk controls. StoxOptionHub does not publicly disclose individual trader identities for security and operational reasons.",
      },
      {
        q: "How transparent is the trading activity?",
        a: "Your dashboard shows your investment status, plan duration, and wallet balance at all times. Detailed strategy-level trade logs are not publicly shared, but your overall position and lifecycle events are fully visible.",
      },
    ],
  },
  {
    id: "mentorship",
    label: "Mentorship",
    questions: [
      {
        q: "What is the mentorship program?",
        a: "Mentorship is an educational program with structured learning tracks covering trading fundamentals, technical analysis, risk management, and portfolio building. It is taught by experienced practitioners through a progressive curriculum.",
      },
      {
        q: "Is mentorship financial advice?",
        a: "No. Mentorship content is purely educational. It does not constitute financial advice, investment recommendations, or trading signals. All trading and investment decisions remain the sole responsibility of the investor.",
      },
      {
        q: "Does mentorship guarantee trading success?",
        a: "No. Education equips you with knowledge and frameworks, but market outcomes are never guaranteed. The mentorship program is a learning system, not a profit-making service.",
      },
      {
        q: "How do I access mentorship content?",
        a: "Mentorship content is available within your dashboard after registration. Depending on your membership plan, you may have access to beginner, intermediate, or advanced tracks, live sessions, and community groups.",
      },
    ],
  },
  {
    id: "security",
    label: "Security",
    questions: [
      {
        q: "How are deposits secured?",
        a: "All deposits require manual on-chain verification before crediting. This prevents fraudulent or uncompleted deposits from being processed. Admin approval is required for every deposit.",
      },
      {
        q: "Can I manually edit my wallet balance?",
        a: "No. Users cannot manually edit wallet balances. All balance changes are the result of approved deposits, completed withdrawals, investment plan purchases, or system-credited maturities — all fully audited.",
      },
      {
        q: "Is my personal data safe?",
        a: "Your data is stored securely and is not shared with third parties without consent. We use industry-standard encryption for all authentication and session management.",
      },
    ],
  },
  {
    id: "withdrawals",
    label: "Withdrawals",
    questions: [
      {
        q: "How do I withdraw funds?",
        a: "Go to your Wallet page and submit a withdrawal request with your crypto address and amount. Our team reviews the request and processes it to your specified address.",
      },
      {
        q: "What is the minimum withdrawal?",
        a: "The minimum withdrawal amount is $1,000 USDT equivalent.",
      },
      {
        q: "How long do withdrawals take?",
        a: "Withdrawals typically take 1–3 business days to process after submission. Processing time depends on admin availability and network conditions.",
      },
      {
        q: "Can I withdraw capital currently in an active investment plan?",
        a: "No. Capital allocated to an active plan is locked until plan maturity. You can only withdraw from your available wallet balance.",
      },
    ],
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("account");
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredCategories = search.trim()
    ? categories
        .map((cat) => ({
          ...cat,
          questions: cat.questions.filter(
            ({ q, a }) =>
              q.toLowerCase().includes(search.toLowerCase()) ||
              a.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((cat) => cat.questions.length > 0)
    : categories.filter((cat) => cat.id === activeCategory);

  return (
    <div className="bg-[#0a0a0a] text-white">

      {/* ── Hero ── */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-[#1a1a1a] text-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(240,180,41,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(240,180,41,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#f0b429]/5 rounded-full blur-[80px] pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f0b429]/10 border border-[#f0b429]/20 rounded-full mb-5">
            <Search size={11} className="text-[#f0b429]" />
            <span className="text-[11px] text-[#f0b429] font-semibold uppercase tracking-wider">Help Center</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight mb-4">Frequently Asked Questions</h1>
          <p className="text-[16px] text-[#888] mb-8 leading-relaxed">
            Find answers to common questions about the platform, wallet, investments, copy trading, mentorship, and withdrawals.
          </p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              aria-label="Search FAQ"
              className="w-full pl-10 pr-4 py-3.5 bg-[#111] border border-[#1e1e1e] rounded-xl text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 transition-colors"
            />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">

          {/* Category sidebar */}
          {!search.trim() && (
            <nav className="lg:w-56 shrink-0" aria-label="FAQ categories">
              <ul className="space-y-1 lg:sticky lg:top-24">
                {categories.map(({ id, label }) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => setActiveCategory(id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] transition-colors ${
                        activeCategory === id
                          ? "bg-[#f0b429]/10 text-[#f0b429] font-semibold"
                          : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"
                      }`}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Questions */}
          <div className="flex-1 min-w-0">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-16 text-[#555]">
                <p className="text-[14px]">No results found for &ldquo;{search}&rdquo;.</p>
                <p className="text-[12px] mt-2">Try a different search term or browse by category.</p>
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <div key={cat.id} className="mb-8">
                  {search.trim() && (
                    <h2 className="text-[14px] font-semibold text-[#f0b429] uppercase tracking-wider mb-4">
                      {cat.label}
                    </h2>
                  )}
                  <div className="space-y-2">
                    {cat.questions.map(({ q, a }) => {
                      const key = `${cat.id}-${q}`;
                      const isOpen = openItems.has(key);
                      return (
                        <div key={q} className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                          isOpen ? "border-[#f0b429]/20 bg-[#111]" : "border-[#1e1e1e] bg-[#0d0d0d] hover:border-[#2a2a2a]"
                        }`}>
                          <button
                            type="button"
                            onClick={() => toggleItem(key)}
                            aria-expanded={isOpen ? "true" : "false"}
                            className="flex items-center justify-between w-full px-5 py-4 text-left gap-4"
                          >
                            <span className="text-[14px] font-medium text-white">{q}</span>
                            <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                              isOpen ? "bg-[#f0b429]/10 text-[#f0b429]" : "bg-[#1a1a1a] text-[#555]"
                            }`}>
                              <ChevronDown
                                size={11}
                                className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                              />
                            </span>
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-4">
                              <p className="text-[13px] text-[#666] leading-relaxed">{a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Still have questions */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d] border-t border-[#1a1a1a] text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-3">Still Have Questions?</h2>
          <p className="text-[14px] text-[#555] mb-6 leading-relaxed">
            Our support team is available Monday to Friday, 9AM–6PM UTC. We typically respond within 1–2 business days.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#f0b429] hover:bg-[#e0a424] text-black font-bold text-[13px] rounded-xl transition-all hover:shadow-[0_0_16px_rgba(240,180,41,0.35)]"
            >
              Contact Support <ArrowRight size={13} />
            </Link>
            <a
              href="mailto:support@stoxoptionhub.com"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#2a2a2a] hover:border-[#f0b429]/30 text-white font-semibold text-[13px] rounded-xl transition-all"
            >
              support@stoxoptionhub.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
