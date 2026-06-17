"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 5000,  suffix: "+", label: "Active Members",    prefix: ""  },
  { value: 40,    suffix: "+", label: "Countries Served",  prefix: ""  },
  { value: 2.4,   suffix: "M+",label: "Volume Tracked",   prefix: "$" },
  { value: 99.8,  suffix: "%", label: "Platform Uptime",  prefix: ""  },
];

function useCountUp(target: number, duration = 1800, started: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(parseFloat((eased * target).toFixed(target % 1 !== 0 ? 1 : 0)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, started]);
  return count;
}

function StatItem({ stat, started }: { stat: typeof STATS[0]; started: boolean }) {
  const count = useCountUp(stat.value, 1800, started);
  return (
    <div className="text-center group">
      <div className="text-3xl sm:text-4xl font-bold text-white mb-1 tabular-nums">
        {stat.prefix}
        {stat.value % 1 !== 0 ? count.toFixed(1) : Math.floor(count).toLocaleString()}
        <span className="text-[#f0b429]">{stat.suffix}</span>
      </div>
      <div className="text-[12px] text-[#555] uppercase tracking-widest">{stat.label}</div>
    </div>
  );
}

export default function AnimatedStats() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
      {STATS.map((stat) => (
        <StatItem key={stat.label} stat={stat} started={started} />
      ))}
    </div>
  );
}
