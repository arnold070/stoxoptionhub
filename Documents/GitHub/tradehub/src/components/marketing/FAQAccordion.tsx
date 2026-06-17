"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={`border rounded-xl overflow-hidden transition-all duration-200 ${
              isOpen
                ? "border-[#f0b429]/20 bg-[#111]"
                : "border-[#1e1e1e] bg-[#0d0d0d] hover:border-[#2a2a2a]"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-[14px] font-medium text-white">{item.q}</span>
              <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                isOpen ? "bg-[#f0b429]/10 text-[#f0b429]" : "bg-[#1a1a1a] text-[#555]"
              }`}>
                {isOpen ? <Minus size={11} /> : <Plus size={11} />}
              </span>
            </button>
            {isOpen && (
              <div className="px-5 pb-4">
                <p className="text-[13px] text-[#666] leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
