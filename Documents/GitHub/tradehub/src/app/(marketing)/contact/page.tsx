"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, Clock, MessageSquare, ArrowRight, CheckCircle, Send, Globe, Shield } from "lucide-react";

export default function ContactPage() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string).trim();
    const email = (fd.get("email") as string).trim();
    const subject = (fd.get("subject") as string).trim();
    const message = (fd.get("message") as string).trim();

    if (!name || !email || !subject || !message) {
      setError("All fields are required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 800));
      setSubmitted(true);
    });
  }

  return (
    <div className="bg-[#0a0a0a] text-white">

      {/* ── Hero ── */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-[#1a1a1a]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(240,180,41,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(240,180,41,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#f0b429]/5 rounded-full blur-[80px] pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f0b429]/10 border border-[#f0b429]/20 rounded-full mb-5">
            <Send size={11} className="text-[#f0b429]" />
            <span className="text-[11px] text-[#f0b429] font-semibold uppercase tracking-wider">Get in Touch</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight mb-4">Contact Us</h1>
          <p className="text-[16px] text-[#888] max-w-xl mx-auto leading-relaxed">
            Have questions about the platform, investment plans, or mentorship? Our support team typically responds within 1–2 business days.
          </p>
        </div>
      </section>

      {/* ── Info cards + Form ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">

          {/* Info column */}
          <div className="space-y-4">
            {/* Email */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 hover:border-[#f0b429]/15 transition-all group">
              <div className="w-10 h-10 bg-[#f0b429]/10 group-hover:bg-[#f0b429]/15 rounded-xl flex items-center justify-center mb-3 transition-colors">
                <Mail size={16} className="text-[#f0b429]" />
              </div>
              <h3 className="text-[14px] font-semibold text-white mb-1">Email Support</h3>
              <a href="mailto:support@stoxoptionhub.com" className="text-[13px] text-[#888] hover:text-white transition-colors">
                support@stoxoptionhub.com
              </a>
              <p className="text-[12px] text-[#444] mt-1 leading-relaxed">For account, deposit, and general inquiries</p>
            </div>

            {/* Hours */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 hover:border-[#f0b429]/15 transition-all group">
              <div className="w-10 h-10 bg-[#f0b429]/10 group-hover:bg-[#f0b429]/15 rounded-xl flex items-center justify-center mb-3 transition-colors">
                <Clock size={16} className="text-[#f0b429]" />
              </div>
              <h3 className="text-[14px] font-semibold text-white mb-2">Business Hours</h3>
              <div className="space-y-1.5">
                {[
                  { day: "Mon – Fri", hours: "9AM – 6PM UTC" },
                  { day: "Saturday", hours: "10AM – 2PM UTC" },
                  { day: "Sunday", hours: "Closed" },
                ].map(({ day, hours }) => (
                  <div key={day} className="flex items-center justify-between text-[12px]">
                    <span className="text-[#555]">{day}</span>
                    <span className={hours === "Closed" ? "text-[#444]" : "text-white font-medium"}>{hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick answers */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 hover:border-[#f0b429]/15 transition-all group">
              <div className="w-10 h-10 bg-[#f0b429]/10 group-hover:bg-[#f0b429]/15 rounded-xl flex items-center justify-center mb-3 transition-colors">
                <MessageSquare size={16} className="text-[#f0b429]" />
              </div>
              <h3 className="text-[14px] font-semibold text-white mb-1">Quick Answers</h3>
              <p className="text-[13px] text-[#555] leading-relaxed mb-3">
                Many questions are answered in our FAQ section.
              </p>
              <Link href="/faq" className="inline-flex items-center gap-1.5 text-[#f0b429] text-[13px] font-semibold hover:opacity-80 transition-opacity">
                Browse FAQ <ArrowRight size={12} />
              </Link>
            </div>

            {/* Security note */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 hover:border-[#f0b429]/15 transition-all group">
              <div className="w-10 h-10 bg-[#f0b429]/10 group-hover:bg-[#f0b429]/15 rounded-xl flex items-center justify-center mb-3 transition-colors">
                <Shield size={16} className="text-[#f0b429]" />
              </div>
              <h3 className="text-[14px] font-semibold text-white mb-1">Security Notice</h3>
              <p className="text-[12px] text-[#555] leading-relaxed">
                Never share your password, PIN, or private keys in any message. Our team will never ask for these.
              </p>
            </div>

            {/* Global reach */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-[#22c55e]/10 rounded-xl flex items-center justify-center shrink-0">
                <Globe size={16} className="text-[#22c55e]" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white mb-1">Global Support</h3>
                <p className="text-[12px] text-[#555] leading-relaxed">Serving investors across 40+ countries with multi-lingual support available on request.</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 sm:p-8">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-[#22c55e]/10 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={28} className="text-[#22c55e]" />
                  </div>
                  <h2 className="text-[22px] font-bold text-white mb-2">Message Sent</h2>
                  <p className="text-[14px] text-[#555] max-w-sm leading-relaxed">
                    Thank you for reaching out. Our team will review your message and respond within 1–2 business days.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 text-[#f0b429] text-[13px] font-semibold hover:opacity-80 transition-opacity"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-[22px] font-bold text-white mb-1">Send a Message</h2>
                    <p className="text-[13px] text-[#555]">We typically respond within 1–2 business days.</p>
                  </div>

                  {error && (
                    <div className="mb-5 p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-[13px]">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-[11px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">
                          Full Name
                        </label>
                        <input
                          id="name" name="name" type="text" required autoComplete="name"
                          placeholder="Jane Smith"
                          className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 focus:bg-[#1a1a1a] transition-colors"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-[11px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">
                          Email Address
                        </label>
                        <input
                          id="email" name="email" type="email" required autoComplete="email"
                          placeholder="jane@example.com"
                          className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-[11px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">
                        Topic
                      </label>
                      <select
                        id="subject" name="subject" required defaultValue=""
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-[13px] text-white outline-none focus:border-[#f0b429]/50 transition-colors appearance-none"
                      >
                        <option value="" disabled className="text-[#444]">Select a topic</option>
                        <option value="account">Account & Registration</option>
                        <option value="deposit">Wallet & Deposits</option>
                        <option value="investment">Investment Plans</option>
                        <option value="copy-trading">Copy Trading</option>
                        <option value="mentorship">Mentorship Program</option>
                        <option value="withdrawal">Withdrawals</option>
                        <option value="security">Security</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-[11px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">
                        Message
                      </label>
                      <textarea
                        id="message" name="message" required rows={5}
                        placeholder="Describe your question or issue in detail..."
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 transition-colors resize-none"
                      />
                    </div>

                    <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#222]">
                      <p className="text-[11px] text-[#444] leading-relaxed">
                        This form is for general inquiries only. For urgent issues, email{" "}
                        <a href="mailto:support@stoxoptionhub.com" className="text-[#666] hover:text-white transition-colors">support@stoxoptionhub.com</a>{" "}
                        directly. Do not include passwords, PINs, or private keys.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full py-3.5 bg-[#f0b429] hover:bg-[#e0a424] disabled:opacity-50 text-black font-bold text-[13px] rounded-xl uppercase tracking-wide transition-all hover:shadow-[0_0_16px_rgba(240,180,41,0.35)] flex items-center justify-center gap-2"
                    >
                      {isPending ? (
                        <>
                          <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>Send Message <Send size={13} /></>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
