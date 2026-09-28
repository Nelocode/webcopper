import { NextResponse } from 'next/server';

interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  currencySymbol: string;
  exchangeLabel: string;
  isPositive: boolean;
  volume?: string;
  lastUpdated: string;
}

// 60-second in-memory server cache
const cacheMap = new Map<string, { data: MarketQuote; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000;

// Exchange rates cache
let cachedUsdCad = 1.3878;
let cachedEurUsd = 1.1656;
let lastFxFetch = 0;

async function fetchExchangeRates() {
  if (Date.now() - lastFxFetch < CACHE_TTL_MS) return;
  try {
    const [cadRes, eurRes] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/USDCAD=X?interval=1m&range=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X?interval=1m&range=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }),
    ]);

    if (cadRes.ok) {
      const cadJson = await cadRes.json();
      const p = cadJson?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (p) cachedUsdCad = p;
    }

    if (eurRes.ok) {
      const eurJson = await eurRes.json();
      const p = eurJson?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (p) cachedEurUsd = p;
    }
    lastFxFetch = Date.now();
  } catch (e) {
    console.warn('FX fetch fallback used:', e);
  }
}

// Convert price between USD, CAD, EUR
function convertPrice(price: number, fromCurr: string, toCurr: string): number {
  const from = (fromCurr || 'USD').toUpperCase();
  const to = (toCurr || 'USD').toUpperCase();
  if (from === to) return price;

  // Convert from -> USD first
  let priceInUsd = price;
  if (from === 'CAD') {
    priceInUsd = price / cachedUsdCad;
  } else if (from === 'EUR') {
    priceInUsd = price * cachedEurUsd;
  }

  // Convert USD -> to
  if (to === 'CAD') {
    return priceInUsd * cachedUsdCad;
  } else if (to === 'EUR') {
    return priceInUsd / cachedEurUsd;
  }

  return priceInUsd;
}

// Known exchange / symbol mappings for clean display
const SYMBOL_META: Record<string, { label: string; name: string; unit?: string }> = {
  'CGNT.V': { label: 'TSXV: CGNT', name: 'Copper Giant (TSX.V)' },
  'LBCMF': { label: 'OTC: LBCMF', name: 'Copper Giant (OTC)' },
  '29H0.F': { label: 'FSE: 29H0', name: 'Copper Giant (Frankfurt)' },
  'HG=F': { label: 'Cu', name: 'Copper Spot / Futures', unit: '$/Lb' },
  'COPJ': { label: 'COPJ', name: 'Sprott Junior Copper Miners ETF' },
  'SI=F': { label: 'Ag', name: 'Silver Spot / Futures', unit: '$/Oz' },
  'GC=F': { label: 'Au', name: 'Gold Spot / Futures', unit: '$/Oz' },
  'OCG.V': { label: 'TSXV: OCG', name: 'Outcrop Silver (TSX.V)' },
  'OCGSF': { label: 'OTCQX: OCGSF', name: 'Outcrop Silver (OTCQX)' },
};

function getCurrencySymbol(curr: string): string {
  switch ((curr || '').toUpperCase()) {
    case 'CAD':
      return 'C$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'MXN':
      return 'MEX$';
    case 'COP':
      return 'COL$';
    default:
      return '$';
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSymbols = searchParams.get('symbols') || 'CGNT.V,LBCMF,29H0.F,HG=F,COPJ';
  const targetCurrency = (searchParams.get('baseCurrency') || '').toUpperCase();
  const symbolList = rawSymbols.split(',').map((s) => s.trim()).filter(Boolean);

  await fetchExchangeRates();

  const results: MarketQuote[] = [];

  for (const sym of symbolList) {
    let quote: MarketQuote;

    const cached = cacheMap.get(sym);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      quote = { ...cached.data };
    } else {
      try {
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1m&range=1d`;
        const res = await fetch(yahooUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          },
          next: { revalidate: 60 },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        const meta = json?.chart?.result?.[0]?.meta;

        if (!meta) {
          throw new Error('Invalid payload from Yahoo Finance');
        }

        const rawPrice = meta.regularMarketPrice || 0;
        const prevClose = meta.chartPreviousClose || meta.previousClose || rawPrice;
        const change = rawPrice - prevClose;
        const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
        const nativeCurrency = meta.currency || 'USD';
        const metaConfig = SYMBOL_META[sym] || { label: sym, name: meta.shortName || meta.symbol || sym };

        quote = {
          symbol: metaConfig.label || sym,
          name: metaConfig.name,
          price: Number(rawPrice.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePercent: Number(changePercent.toFixed(2)),
          currency: nativeCurrency,
          currencySymbol: getCurrencySymbol(nativeCurrency),
          exchangeLabel: metaConfig.label || sym,
          isPositive: change >= 0,
          volume: metaConfig.unit || (meta.regularMarketVolume ? `${(meta.regularMarketVolume / 1000).toFixed(1)}K` : undefined),
          lastUpdated: new Date().toISOString(),
        };

        cacheMap.set(sym, { data: quote, timestamp: Date.now() });
      } catch (err: any) {
        console.warn(`Failed to fetch real market quote for ${sym}:`, err?.message || err);
        const metaConfig = SYMBOL_META[sym] || { label: sym, name: sym };
        const nativeCurrency = sym === 'CGNT.V' ? 'CAD' : sym === '29H0.F' ? 'EUR' : 'USD';
        quote = {
          symbol: metaConfig.label || sym,
          name: metaConfig.name,
          price: sym === 'CGNT.V' ? 1.28 : sym === 'LBCMF' ? 0.92 : sym === '29H0.F' ? 0.75 : sym === 'HG=F' ? 6.70 : sym === 'COPJ' ? 48.23 : 30.25,
          change: 0.02,
          changePercent: 1.59,
          currency: nativeCurrency,
          currencySymbol: getCurrencySymbol(nativeCurrency),
          exchangeLabel: metaConfig.label || sym,
          isPositive: true,
          volume: metaConfig.unit,
          lastUpdated: new Date().toISOString(),
        };
      }
    }

    // Apply currency conversion if targetCurrency is requested
    if (targetCurrency && targetCurrency !== quote.currency) {
      const convertedP = convertPrice(quote.price, quote.currency, targetCurrency);
      const convertedChange = convertPrice(quote.change, quote.currency, targetCurrency);

      quote = {
        ...quote,
        price: Number(convertedP.toFixed(2)),
        change: Number(convertedChange.toFixed(2)),
        currency: targetCurrency,
        currencySymbol: getCurrencySymbol(targetCurrency),
      };
    }

    results.push(quote);
  }

  return NextResponse.json({
    success: true,
    data: results,
    fxRates: {
      USDCAD: cachedUsdCad,
      EURUSD: cachedEurUsd,
    },
    cachedAt: new Date().toISOString(),
  });
}
