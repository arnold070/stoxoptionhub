import { NextResponse } from "next/server";

// ─── CryptoCompare public API — no key, no geo-block ────────────────────────
const SYMS = "BTC,ETH,SOL,BNB,ADA,AVAX,DOT,MATIC,LINK,XRP,DOGE,LTC";

const SPARK_SYMS = ["BTC", "ETH", "SOL", "BNB"];

const NAMES: Record<string, string> = {
  BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", BNB: "BNB",
  ADA: "Cardano", AVAX: "Avalanche", DOT: "Polkadot", MATIC: "Polygon",
  LINK: "Chainlink", XRP: "XRP", DOGE: "Dogecoin", LTC: "Litecoin",
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
    // Main prices + 4 sparkline history calls in parallel
    const [priceRes, ...sparkRes] = await Promise.all([
      fetch(
        `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${SYMS}&tsyms=USD`,
        { next: { revalidate: 30 }, headers: { Accept: "application/json" } }
      ),
      ...SPARK_SYMS.map((sym) =>
        fetch(
          `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${sym}&tsym=USD&limit=13`,
          { next: { revalidate: 3600 } }
        )
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then((r) => (r.ok ? (r.json() as Promise<any>) : null))
          .catch(() => null)
      ),
    ]);

    if (!priceRes.ok) throw new Error(`CryptoCompare ${priceRes.status}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const priceJson: any = await priceRes.json();
    const raw = priceJson?.RAW ?? {};

    // Build sparkline map: symbol → close prices
    const sparkMap: Record<string, number[]> = {};
    SPARK_SYMS.forEach((sym, i) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hist = sparkRes[i]?.Data?.Data as any[] | undefined;
      if (Array.isArray(hist) && hist.length > 0) {
        sparkMap[sym] = hist.map((h) => h.close as number);
      }
    });

    const data: MarketCoin[] = SYMS.split(",").map((sym) => {
      const d = raw[sym]?.USD ?? {};
      return {
        id: sym.toLowerCase(),
        symbol: sym,
        name: NAMES[sym] ?? sym,
        price: d.PRICE ?? 0,
        change24h: d.CHANGEPCT24HOUR ?? 0,
        high24h: d.HIGH24HOUR ?? 0,
        low24h: d.LOW24HOUR ?? 0,
        volume24h: d.TOTALVOLUME24HTO ?? 0,
        marketCap: d.MKTCAP ?? 0,
        sparkline: sparkMap[sym] ?? [],
      };
    });

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("[market]", err);
    return NextResponse.json({ error: "market_unavailable" }, { status: 503 });
  }
}
