import { NextResponse } from "next/server";

const COIN_IDS = [
  "bitcoin", "ethereum", "solana", "binancecoin",
  "cardano", "avalanche-2", "polkadot", "matic-network",
  "chainlink", "ripple", "dogecoin", "litecoin",
].join(",");

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  sparkline: number[];
}

export async function GET() {
  try {
    const url =
      `https://api.coingecko.com/api/v3/coins/markets` +
      `?vs_currency=usd&ids=${COIN_IDS}&order=market_cap_desc` +
      `&per_page=12&sparkline=true`;

    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any[] = await res.json();

    const data: MarketCoin[] = raw.map((c) => {
      const allPrices: number[] = c.sparkline_in_7d?.price ?? [];
      // Downsample ~168 hourly points to 14 for the sparkline
      const step = Math.max(1, Math.floor(allPrices.length / 14));
      const sparkline = allPrices.filter((_, i) => i % step === 0).slice(-14);
      return {
        id: c.id,
        symbol: (c.symbol as string).toUpperCase(),
        name: c.name,
        price: c.current_price ?? 0,
        change24h: c.price_change_percentage_24h ?? 0,
        high24h: c.high_24h ?? 0,
        low24h: c.low_24h ?? 0,
        marketCap: c.market_cap ?? 0,
        sparkline,
      };
    });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch {
    return NextResponse.json({ error: "market_unavailable" }, { status: 503 });
  }
}
