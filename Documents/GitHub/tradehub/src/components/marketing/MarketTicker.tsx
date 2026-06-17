"use client";

const COINS = [
  { symbol: "BTC",   name: "Bitcoin",  price: "67,234.50", change: "+2.41%", up: true  },
  { symbol: "ETH",   name: "Ethereum", price: "3,512.80",  change: "+1.83%", up: true  },
  { symbol: "SOL",   name: "Solana",   price: "142.30",    change: "-0.72%", up: false },
  { symbol: "BNB",   name: "BNB",      price: "412.50",    change: "+3.14%", up: true  },
  { symbol: "ADA",   name: "Cardano",  price: "0.468",     change: "+5.21%", up: true  },
  { symbol: "AVAX",  name: "Avalanche",price: "35.70",     change: "+4.30%", up: true  },
  { symbol: "DOT",   name: "Polkadot", price: "8.92",      change: "-1.18%", up: false },
  { symbol: "MATIC", name: "Polygon",  price: "0.723",     change: "+2.80%", up: true  },
  { symbol: "LINK",  name: "Chainlink",price: "14.20",     change: "+1.92%", up: true  },
  { symbol: "XRP",   name: "XRP",      price: "0.578",     change: "-0.43%", up: false },
  { symbol: "DOGE",  name: "Dogecoin", price: "0.162",     change: "+7.31%", up: true  },
  { symbol: "LTC",   name: "Litecoin", price: "78.40",     change: "-1.50%", up: false },
];

export default function MarketTicker() {
  const items = [...COINS, ...COINS];

  return (
    <div className="bg-[#0d0d0d] border-b border-[#1a1a1a] overflow-hidden">
      <div className="flex items-center">
        {/* Label */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#111] border-r border-[#1a1a1a] z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse shrink-0" />
          <span className="text-[10px] text-[#555] font-semibold uppercase tracking-widest whitespace-nowrap">Live Markets</span>
        </div>

        {/* Scrolling track */}
        <div className="overflow-hidden flex-1 min-w-0 relative">
          <div className="animate-ticker flex items-center gap-0">
            {items.map((coin, i) => (
              <div
                key={i}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 border-r border-[#1a1a1a]"
              >
                <span className="text-[11px] font-bold text-white">{coin.symbol}</span>
                <span className="text-[11px] text-[#666]">${coin.price}</span>
                <span className={`text-[10px] font-semibold ${coin.up ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {coin.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
