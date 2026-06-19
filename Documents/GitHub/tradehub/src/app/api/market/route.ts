import { NextResponse } from "next/server";

const COIN_IDS = [
  "bitcoin", "ethereum", "solana", "binancecoin",
  "cardano", "avalanche-2", "polkadot", "matic-network",
  "chainlink", "ripple", "dogecoin", "litecoin",
];

const SYM_MAP: Record<string, string> = {
  bitcoin: "BTC", ethereum: "ETH", solana: "SOL",
  binancecoin: "BNB", cardano: "ADA", "avalanche-2": "AVAX",
  polkadot: "DOT", "matic-network": "MATIC", chainlink: "LINK",
  ripple: "XRP", dogecoin: "DOGE", litecoin: "LTC",
};

const NAMES: Record<string, string> = {
  bitcoin: "Bitcoin", ethereum: "Ethereum", solana: "Solana",
  binancecoin: "BNB", cardano: "Cardano", "avalanche-2": "Avalanche",
  polkadot: "Polkadot", "matic-network": "Polygon", chainlink: "Chainlink",
  ripple: "XRP", dogecoin: "Dogecoin", litecoin: "Litecoin",
};

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap?: number;
  sparkline: number[];
}

export async function GET() {
  try {
    const url =
      `https://api.coingecko.com/api/v3/coins/markets` +
      `?vs_currency=usd` +
      `&ids=${COIN_IDS.join(",")}` +
      `&order=market_cap_desc` +
      `&per_page=12&page=1` +
      `&sparkline=true` +
      `&price_change_percentage=24h`;

    const res = await fetch(url, {
      next: { revalidate: 30 },
      headers: {
        Accept: "application/json",
        "User-Agent": "stoxoptionhub/1.0",
      },
    });

    if (!res.ok) {
      console.error("[market] CoinGecko status:", res.status);
      throw new Error(`CoinGecko ${res.status}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any[] = await res.json();
    if (!Array.isArray(raw)) throw new Error("unexpected response");

    const data: MarketCoin[] = COIN_IDS.map((id) => {
      const d = raw.find((r) => r.id === id) ?? {};
      const sparkRaw: number[] = d.sparkline_in_7d?.price ?? [];
      // Downsample 168-point array to ~14 points
      const step = Math.max(1, Math.floor(sparkRaw.length / 14));
      const sparkline = sparkRaw.filter((_, i) => i % step === 0).slice(0, 14);

      return {
        id,
        symbol: SYM_MAP[id] ?? id.toUpperCase(),
        name: NAMES[id] ?? id,
        price: d.current_price ?? 0,
        change24h: d.price_change_percentage_24h ?? 0,
        high24h: d.high_24h ?? 0,
        low24h: d.low_24h ?? 0,
        volume24h: d.total_volume ?? 0,
        marketCap: d.market_cap,
        sparkline,
      };
    });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("[market]", err);
    return NextResponse.json({ error: "market_unavailable" }, { status: 503 });
  }
}
