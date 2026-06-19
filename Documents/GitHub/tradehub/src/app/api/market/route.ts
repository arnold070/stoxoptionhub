import { NextResponse } from "next/server";

// ─── Binance public REST API — no key required ────────────────────────────────

const PAIRS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT",
  "ADAUSDT", "AVAXUSDT", "DOTUSDT", "MATICUSDT",
  "LINKUSDT", "XRPUSDT", "DOGEUSDT", "LTCUSDT",
];

const SPARKLINE_PAIRS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];

const META: Record<string, { name: string }> = {
  BTCUSDT:   { name: "Bitcoin" },
  ETHUSDT:   { name: "Ethereum" },
  SOLUSDT:   { name: "Solana" },
  BNBUSDT:   { name: "BNB" },
  ADAUSDT:   { name: "Cardano" },
  AVAXUSDT:  { name: "Avalanche" },
  DOTUSDT:   { name: "Polkadot" },
  MATICUSDT: { name: "Polygon" },
  LINKUSDT:  { name: "Chainlink" },
  XRPUSDT:   { name: "XRP" },
  DOGEUSDT:  { name: "Dogecoin" },
  LTCUSDT:   { name: "Litecoin" },
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
  sparkline: number[];
}

export async function GET() {
  try {
    const symbolsJson = encodeURIComponent(JSON.stringify(PAIRS));

    // Parallel: 24 h tickers + 4h klines for sparklines
    const [tickerRes, ...klinesResults] = await Promise.all([
      fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsJson}`,
        { next: { revalidate: 30 } }
      ),
      ...SPARKLINE_PAIRS.map((sym) =>
        fetch(
          `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=4h&limit=14`,
          { next: { revalidate: 3600 } }
        )
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then((r) => (r.ok ? (r.json() as Promise<any[]>) : Promise.resolve([])))
          .catch(() => [] as unknown[])
      ),
    ]);

    if (!tickerRes.ok) throw new Error(`Binance ticker ${tickerRes.status}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tickers: any[] = await tickerRes.json();

    // sparkline map: pair → close prices
    const sparkMap: Record<string, number[]> = {};
    SPARKLINE_PAIRS.forEach((sym, i) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const klines = klinesResults[i] as any[];
      if (Array.isArray(klines) && klines.length > 0) {
        sparkMap[sym] = klines.map((k) => parseFloat(k[4])); // index 4 = close
      }
    });

    const data: MarketCoin[] = tickers.map((t) => {
      const symbol = (t.symbol as string).replace("USDT", "");
      const price = parseFloat(t.lastPrice);
      const open = parseFloat(t.openPrice);
      const change24h = open > 0 ? ((price - open) / open) * 100 : 0;
      return {
        id: symbol.toLowerCase(),
        symbol,
        name: META[t.symbol]?.name ?? symbol,
        price,
        change24h,
        high24h: parseFloat(t.highPrice),
        low24h: parseFloat(t.lowPrice),
        volume24h: parseFloat(t.quoteVolume),
        sparkline: sparkMap[t.symbol] ?? [],
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
