"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Zap, ChevronDown } from "lucide-react";

type NavLeaf = { href: string; label: string };
type NavDropdown = { label: string; children: Array<NavLeaf> };
type NavLink = NavLeaf | NavDropdown;

function isDropdown(item: NavLink): item is NavDropdown {
  return "children" in item;
}

const navLinks: NavLink[] = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
  {
    label: "Products",
    children: [
      { href: "/investment-plans", label: "Investment Plans" },
      { href: "/copy-trading", label: "Copy Trading" },
      { href: "/mentorship", label: "Mentorship" },
    ],
  },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const firstNavRef = useRef<HTMLAnchorElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); setProductsOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); menuBtnRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) firstNavRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isProductActive = navLinks
    .find((l) => isDropdown(l) && (l as NavDropdown).children.some((c) => c.href === pathname));

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          : "bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#1e1e1e]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 bg-[#1a1a1a] group-hover:bg-[#f0b429]/10 rounded-lg border border-[#2a2a2a] group-hover:border-[#f0b429]/30 flex items-center justify-center transition-all">
              <Zap size={15} className="text-[#f0b429]" />
            </div>
            <span className="text-[15px] font-bold text-white">StoxOptionHub</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
            {navLinks.map((item) => {
              if (isDropdown(item)) {
                const active = !!isProductActive;
                return (
                  <div key={item.label} className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setProductsOpen((v) => !v)}
                      aria-expanded={productsOpen ? "true" : "false"}
                      className={`flex items-center gap-1 px-4 py-2 text-[13px] rounded-md transition-colors ${
                        active ? "text-white bg-[#1a1a1a]" : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"
                      }`}
                    >
                      {item.label}
                      <ChevronDown size={12} className={`transition-transform duration-200 ${productsOpen ? "rotate-180" : ""}`} />
                    </button>
                    {productsOpen && (
                      <div className="absolute top-full left-0 mt-2 w-52 bg-[#111]/95 backdrop-blur-xl border border-[#1e1e1e] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1.5 z-50">
                        {item.children.map((child) => {
                          const childActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] transition-colors ${
                                childActive
                                  ? "text-[#f0b429] bg-[#f0b429]/5"
                                  : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"
                              }`}
                            >
                              {childActive && <span className="w-1 h-1 rounded-full bg-[#f0b429] shrink-0" />}
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 text-[13px] rounded-md transition-colors ${
                    active ? "text-white" : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#f0b429] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-[13px] text-[#888] hover:text-white transition-colors rounded-md hover:bg-[#1a1a1a]"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-[#f0b429] hover:bg-[#e0a424] text-black text-[13px] font-bold rounded-lg transition-all hover:shadow-[0_0_16px_rgba(240,180,41,0.35)]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            ref={menuBtnRef}
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open ? "true" : "false"}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-md text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          id="mobile-nav"
          className="md:hidden border-t border-[#1e1e1e] bg-[#0a0a0a]/98 backdrop-blur-xl px-4 py-4 space-y-1"
          role="navigation"
          aria-label="Mobile navigation"
        >
          {navLinks.map((item, i) => {
            if ("children" in item) {
              return (
                <div key={item.label}>
                  <div className="px-3 py-2 text-[11px] text-[#555] uppercase tracking-wider font-semibold">
                    {item.label}
                  </div>
                  {item.children.map((child, j) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        ref={i === 0 && j === 0 ? firstNavRef : undefined}
                        href={child.href}
                        className={`block px-4 py-2.5 text-[14px] rounded-lg transition-colors min-h-[44px] flex items-center gap-2 ${
                          childActive ? "text-[#f0b429] bg-[#f0b429]/5" : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"
                        }`}
                      >
                        {childActive && <span className="w-1.5 h-1.5 rounded-full bg-[#f0b429] shrink-0" />}
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              );
            }
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                ref={i === 0 ? firstNavRef : undefined}
                href={item.href}
                className={`block px-3 py-2.5 text-[14px] rounded-lg transition-colors min-h-[44px] flex items-center gap-2 ${
                  active ? "text-[#f0b429] bg-[#f0b429]/5" : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"
                }`}
              >
                {active && <span className="w-1.5 h-1.5 rounded-full bg-[#f0b429] shrink-0" />}
                {item.label}
              </Link>
            );
          })}
          <div className="pt-3 space-y-2 border-t border-[#1e1e1e] mt-3">
            <Link
              href="/login"
              className="block w-full px-4 py-3 text-center text-[14px] text-[#888] hover:text-white border border-[#1e1e1e] rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="block w-full px-4 py-3 text-center text-[14px] font-bold bg-[#f0b429] hover:bg-[#e0a424] text-black rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
