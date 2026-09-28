'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
  SlidersHorizontal,
  Plus,
  Trash2,
  X,
  RotateCcw,
  Check,
  Search,
} from 'lucide-react';

interface TickerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: string;
  isPositive: boolean;
  category?: string;
}

const PRESET_LIBRARY: TickerData[] = [
  // METALES & MINERALES
  { symbol: 'XAG/USD', name: 'Plata Spot', price: 30.25, change: 0.45, changePercent: 1.51, isPositive: true, category: 'Metales & Minerales' },
  { symbol: 'XAU/USD', name: 'Oro Spot', price: 2350.10, change: -12.30, changePercent: -0.52, isPositive: false, category: 'Metales & Minerales' },
  { symbol: 'HG/USD', name: 'Cobre Spot', price: 4.15, change: 0.08, changePercent: 1.96, isPositive: true, category: 'Metales & Minerales' },
  { symbol: 'Li/USD', name: 'Carbonato de Litio', price: 13.50, change: -0.20, changePercent: -1.46, isPositive: false, category: 'Metales & Minerales' },
  { symbol: 'Pt/USD', name: 'Platino Spot', price: 960.00, change: 14.50, changePercent: 1.53, isPositive: true, category: 'Metales & Minerales' },
  { symbol: 'PA/USD', name: 'Paladio Spot', price: 925.40, change: -8.10, changePercent: -0.87, isPositive: false, category: 'Metales & Minerales' },
  { symbol: 'NI/USD', name: 'Níquel Spot', price: 16800.00, change: 240.00, changePercent: 1.45, isPositive: true, category: 'Metales & Minerales' },
  { symbol: 'ZN/USD', name: 'Zinc Spot', price: 2840.00, change: 15.00, changePercent: 0.53, isPositive: true, category: 'Metales & Minerales' },

  // ENERGÍA & RECURSOS
  { symbol: 'CL/USD', name: 'Petróleo WTI Spot', price: 74.80, change: 1.20, changePercent: 1.63, isPositive: true, category: 'Energía & Recursos' },
  { symbol: 'BZ/USD', name: 'Petróleo Brent Spot', price: 78.90, change: 0.95, changePercent: 1.22, isPositive: true, category: 'Energía & Recursos' },
  { symbol: 'NG/USD', name: 'Gas Natural', price: 2.15, change: -0.05, changePercent: -2.27, isPositive: false, category: 'Energía & Recursos' },
  { symbol: 'URA', name: 'Global X Uranium ETF', price: 26.80, change: 0.75, changePercent: 2.88, isPositive: true, category: 'Energía & Recursos' },

  // ACCIONES MINERAS & ETFS
  { symbol: 'OCG.V', name: 'Outcrop Silver (TSX.V)', price: 0.35, change: 0.02, changePercent: 6.06, volume: '245.3K', isPositive: true, category: 'Acciones Mineras' },
  { symbol: 'OCGSF', name: 'Outcrop Silver (OTCQX)', price: 0.26, change: 0.01, changePercent: 4.00, volume: '112.1K', isPositive: true, category: 'Acciones Mineras' },
  { symbol: 'PAAS', name: 'Pan American Silver', price: 21.40, change: 0.85, changePercent: 4.14, isPositive: true, category: 'Acciones Mineras' },
  { symbol: 'AG', name: 'First Majestic Silver', price: 6.25, change: 0.30, changePercent: 5.04, isPositive: true, category: 'Acciones Mineras' },
  { symbol: 'WPM', name: 'Wheaton Precious Metals', price: 54.20, change: 1.10, changePercent: 2.07, isPositive: true, category: 'Acciones Mineras' },
  { symbol: 'GOLD', name: 'Barrick Gold Corp', price: 17.80, change: -0.25, changePercent: -1.39, isPositive: false, category: 'Acciones Mineras' },
  { symbol: 'NEM', name: 'Newmont Corporation', price: 45.60, change: 0.90, changePercent: 2.01, isPositive: true, category: 'Acciones Mineras' },
  { symbol: 'SIL', name: 'Global X Silver Miners ETF', price: 28.40, change: 0.65, changePercent: 2.34, isPositive: true, category: 'Acciones Mineras' },
  { symbol: 'GDX', name: 'VanEck Gold Miners ETF', price: 34.80, change: -0.42, changePercent: -1.19, isPositive: false, category: 'Acciones Mineras' },

  // ÍNDICES GLOBALES
  { symbol: 'SPX', name: 'S&P 500 Index', price: 5620.50, change: 35.40, changePercent: 0.63, isPositive: true, category: 'Índices Globales' },
  { symbol: 'NDX', name: 'Nasdaq 100 Index', price: 19850.00, change: 180.20, changePercent: 0.92, isPositive: true, category: 'Índices Globales' },
  { symbol: 'DJI', name: 'Dow Jones Industrial', price: 41200.00, change: -85.00, changePercent: -0.21, isPositive: false, category: 'Índices Globales' },
  { symbol: 'TSX', name: 'S&P/TSX Composite', price: 23150.00, change: 110.00, changePercent: 0.48, isPositive: true, category: 'Índices Globales' },

  // DIVISAS & FOREX
  { symbol: 'USD/COP', name: 'Dólar a Peso Colombiano', price: 4045.50, change: -15.00, changePercent: -0.37, isPositive: false, category: 'Divisas & Forex' },
  { symbol: 'EUR/USD', name: 'Euro a Dólar USD', price: 1.0920, change: 0.0035, changePercent: 0.32, isPositive: true, category: 'Divisas & Forex' },
  { symbol: 'USD/CAD', name: 'Dólar a Dólar Canadiense', price: 1.3560, change: -0.0020, changePercent: -0.15, isPositive: false, category: 'Divisas & Forex' },
  { symbol: 'GBP/USD', name: 'Libra a Dólar USD', price: 1.2980, change: 0.0050, changePercent: 0.39, isPositive: true, category: 'Divisas & Forex' },
  { symbol: 'USD/MXN', name: 'Dólar a Peso Mexicano', price: 19.15, change: 0.12, changePercent: 0.63, isPositive: true, category: 'Divisas & Forex' },

  // TECNOLOGÍA & CORPORATIVOS
  { symbol: 'AAPL', name: 'Apple Inc', price: 226.40, change: 3.20, changePercent: 1.43, isPositive: true, category: 'Tecnología' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 415.80, change: -2.40, changePercent: -0.57, isPositive: false, category: 'Tecnología' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 128.50, change: 4.80, changePercent: 3.88, isPositive: true, category: 'Tecnología' },
  { symbol: 'TSLA', name: 'Tesla Inc', price: 215.20, change: -5.40, changePercent: -2.45, isPositive: false, category: 'Tecnología' },
  { symbol: 'AMZN', name: 'Amazon.com Inc', price: 178.60, change: 2.10, changePercent: 1.19, isPositive: true, category: 'Tecnología' },

  // CRITICAL REAL MARKET TICKERS (Screenshot Match)
  { symbol: 'TSXV: CGNT', name: 'Copper Giant Inc (TSX.V)', price: 1.28, change: 0.02, changePercent: 1.59, isPositive: true, category: 'Acciones Mineras' },
  { symbol: 'OTC: LBCMF', name: 'Copper Giant (OTC)', price: 0.92, change: 0.01, changePercent: 0.70, isPositive: true, category: 'Acciones Mineras' },
  { symbol: 'FSE: 29H0', name: 'Copper Giant (Frankfurt)', price: 0.75, change: -0.001, changePercent: -0.13, isPositive: false, category: 'Acciones Mineras' },
  { symbol: 'Cu', name: 'Copper Spot', price: 6.70, change: 0.10, changePercent: 1.51, volume: '$/Lb', isPositive: true, category: 'Metales & Minerales' },
  { symbol: 'COPJ', name: 'Sprott Junior Copper Miners ETF', price: 48.23, change: -0.58, changePercent: -1.20, isPositive: false, category: 'Acciones Mineras' },
  { symbol: 'XAG/USD', name: 'Plata Spot', price: 30.25, change: 0.45, changePercent: 1.51, isPositive: true, category: 'Metales & Minerales' },
  { symbol: 'XAU/USD', name: 'Oro Spot', price: 2350.10, change: -12.30, changePercent: -0.52, isPositive: false, category: 'Metales & Minerales' },
];

const DEFAULT_TICKERS: TickerData[] = [
  { symbol: 'TSXV: CGNT', name: 'Copper Giant Inc (TSX.V)', price: 1.28, change: 0.02, changePercent: 1.59, isPositive: true },
  { symbol: 'OTC: LBCMF', name: 'Copper Giant (OTC)', price: 0.92, change: 0.01, changePercent: 0.70, isPositive: true },
  { symbol: 'FSE: 29H0', name: 'Copper Giant (Frankfurt)', price: 0.75, change: -0.001, changePercent: -0.13, isPositive: false },
  { symbol: 'Cu', name: 'Copper Spot', price: 6.70, change: 0.10, changePercent: 1.51, volume: '$/Lb', isPositive: true },
  { symbol: 'COPJ', name: 'Sprott Junior Copper Miners ETF', price: 48.23, change: -0.58, changePercent: -1.20, isPositive: false },
];

export const FinancialTickerWidget: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showEditModal, setShowEditModal] = useState(false);
  const [tickers, setTickers] = useState<TickerData[]>(DEFAULT_TICKERS);
  const tickersRef = useRef<TickerData[]>(tickers);
  tickersRef.current = tickers;

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'CAD' | 'EUR'>('USD');
  const selectedCurrencyRef = useRef<'USD' | 'CAD' | 'EUR'>(selectedCurrency);
  selectedCurrencyRef.current = selectedCurrency;

  // Form states for manual ticker addition
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Cookie helpers for persistent fallback across sessions
  const saveToCookie = (data: TickerData[]) => {
    try {
      document.cookie = `crm_tenant_market_tickers=${encodeURIComponent(JSON.stringify(data))}; path=/; max-age=31536000`;
    } catch (e) {}
  };

  const getFromCookie = (): TickerData[] | null => {
    try {
      const match = document.cookie.match(/(?:^|; )crm_tenant_market_tickers=([^;]*)/);
      if (match && match[1]) {
        const parsed = JSON.parse(decodeURIComponent(match[1]));
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return null;
  };

  // Fetch REAL Live Market Data from /api/market/quotes with baseCurrency conversion
  const fetchRealQuotes = async (currentList: TickerData[], curr: string = selectedCurrencyRef.current) => {
    setLoading(true);
    try {
      // Map UI symbols to Yahoo Finance API symbols
      const symbolMap: Record<string, string> = {
        'TSXV: CGNT': 'CGNT.V',
        'OTC: LBCMF': 'LBCMF',
        'FSE: 29H0': '29H0.F',
        'Cu': 'HG=F',
        'COPJ': 'COPJ',
        'XAG/USD': 'SI=F',
        'XAU/USD': 'GC=F',
        'OCG.V': 'OCG.V',
        'OCGSF': 'OCGSF',
      };

      const querySymbols = currentList.map((t) => symbolMap[t.symbol] || t.symbol).join(',');
      const res = await fetch(`/api/market/quotes?symbols=${encodeURIComponent(querySymbols)}&baseCurrency=${encodeURIComponent(curr)}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const fetchedQuotesMap = new Map(json.data.map((q: any) => [q.symbol, q]));

        const updated = currentList.map((t) => {
          const apiSym = symbolMap[t.symbol] || t.symbol;
          const realQ: any = fetchedQuotesMap.get(apiSym) || fetchedQuotesMap.get(t.symbol);
          if (realQ) {
            return {
              ...t,
              price: realQ.price,
              change: realQ.change,
              changePercent: realQ.changePercent,
              isPositive: realQ.isPositive,
              volume: realQ.volume || t.volume,
              currencySymbol: realQ.currencySymbol,
            };
          }
          return t;
        });

        tickersRef.current = updated;
        setTickers(updated);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.warn('Real market quotes sync fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load persisted tickers & currency preference on mount + window storage listener
  useEffect(() => {
    let activeList = DEFAULT_TICKERS;
    let preferredCurr: 'USD' | 'CAD' | 'EUR' = 'USD';

    try {
      const savedCurr = localStorage.getItem('crm_ticker_preferred_currency') as any;
      if (savedCurr && ['USD', 'CAD', 'EUR'].includes(savedCurr)) {
        preferredCurr = savedCurr;
        setSelectedCurrency(savedCurr);
      }

      const savedLocal = localStorage.getItem('crm_tenant_market_tickers');
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          activeList = parsed;
        }
      } else {
        const savedCookie = getFromCookie();
        if (savedCookie) {
          activeList = savedCookie;
        }
      }
    } catch (e) {
      console.error('Error loading market tickers:', e);
    }

    tickersRef.current = activeList;
    setTickers(activeList);
    fetchRealQuotes(activeList, preferredCurr);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'crm_tenant_market_tickers' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            tickersRef.current = parsed;
            setTickers(parsed);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle Base Currency Switch
  const handleCurrencyChange = (newCurr: 'USD' | 'CAD' | 'EUR') => {
    setSelectedCurrency(newCurr);
    selectedCurrencyRef.current = newCurr;
    try {
      localStorage.setItem('crm_ticker_preferred_currency', newCurr);
    } catch (e) {}
    fetchRealQuotes(tickersRef.current, newCurr);
  };

  // Save tickers to localStorage, cookie & sync
  const saveTickers = (updatedTickers: TickerData[]) => {
    tickersRef.current = updatedTickers;
    setTickers(updatedTickers);
    try {
      localStorage.setItem('crm_tenant_market_tickers', JSON.stringify(updatedTickers));
      saveToCookie(updatedTickers);
    } catch (e) {
      console.error('Error saving market tickers:', e);
    }
    fetchRealQuotes(updatedTickers, selectedCurrencyRef.current);
  };

  const refreshData = () => {
    fetchRealQuotes(tickersRef.current, selectedCurrencyRef.current);
  };

  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Add custom ticker
  const handleAddCustomTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim() || !newPrice.trim()) return;

    const parsedPrice = parseFloat(newPrice) || 1.0;
    const customTicker: TickerData = {
      symbol: newSymbol.trim().toUpperCase(),
      name: newName.trim() || newSymbol.trim().toUpperCase(),
      price: parsedPrice,
      change: 0.0,
      changePercent: 0.0,
      isPositive: true,
    };

    if (tickersRef.current.some((t) => t.symbol.toUpperCase() === customTicker.symbol)) {
      alert(`El ticker ${customTicker.symbol} ya existe en el panel.`);
      return;
    }

    saveTickers([...tickersRef.current, customTicker]);
    setNewSymbol('');
    setNewName('');
    setNewPrice('');
  };

  // Quick add from search if not in library
  const handleQuickAddSearched = (symbolText: string) => {
    const customTicker: TickerData = {
      symbol: symbolText.trim().toUpperCase(),
      name: symbolText.trim().toUpperCase(),
      price: 100.0,
      change: 0.0,
      changePercent: 0.0,
      isPositive: true,
    };
    saveTickers([...tickersRef.current, customTicker]);
    setSearchQuery('');
  };

  // Toggle preset ticker
  const handleTogglePreset = (preset: TickerData) => {
    const exists = tickersRef.current.some((t) => t.symbol.toUpperCase() === preset.symbol.toUpperCase());
    if (exists) {
      handleDeleteTicker(preset.symbol);
    } else {
      saveTickers([...tickersRef.current, preset]);
    }
  };

  // Remove ticker with dual symbol comparison
  const handleDeleteTicker = (targetSymbol: string) => {
    if (tickersRef.current.length <= 1) {
      alert('Debes mantener al menos 1 ticker activo en el panel.');
      return;
    }

    const updated = tickersRef.current.filter((t) => {
      const matchSymbol = t.symbol.trim().toUpperCase() === targetSymbol.trim().toUpperCase();
      const matchName = t.name.trim().toUpperCase() === targetSymbol.trim().toUpperCase();
      return !matchSymbol && !matchName;
    });

    saveTickers(updated);
  };

  // Reset to default presets
  const handleResetDefaults = () => {
    saveTickers(DEFAULT_TICKERS);
  };

  // Filter library by search query & category
  const filteredLibrary = PRESET_LIBRARY.filter((preset) => {
    const matchesSearch =
      preset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (preset.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || preset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', 'Metales & Minerales', 'Energía & Recursos', 'Acciones Mineras', 'Índices Globales', 'Divisas & Forex', 'Tecnología', 'Criptoactivos'];

  return (
    <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-4 rounded-3xl border border-white/5 shadow-xl w-full font-['Urbanist'] animate-fadeIn relative">
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2 text-white">
          <Activity className="w-5 h-5 text-[var(--accent-primary)]" />
          <h3 className="font-black tracking-tight text-sm uppercase">Live Market Ticker</h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#A1A1A1] border border-white/10 font-mono">
            {tickers.length} Activos
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Base Currency Switcher (USD, CAD, EUR) */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px]">
            {(['USD', 'CAD', 'EUR'] as const).map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => handleCurrencyChange(curr)}
                className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                  selectedCurrency === curr
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={`Ver cotizaciones en ${curr}`}
              >
                {curr === 'USD' ? '$ USD' : curr === 'CAD' ? 'C$ CAD' : '€ EUR'}
              </button>
            ))}
          </div>

          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            {lastUpdated.toLocaleTimeString()}
          </span>

          <button
            onClick={refreshData}
            disabled={loading}
            className={`p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors ${loading ? 'animate-spin' : ''}`}
            title="Actualizar Cotizaciones"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
          </button>

          {/* Edit Market Tickers Button */}
          <button
            onClick={() => setShowEditModal(true)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer"
            title="Buscar & Personalizar Tickers del Panel"
          >
            <Search className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span className="hidden sm:inline">Buscar & Editar Tickers</span>
          </button>
        </div>
      </div>

      {/* Tickers Display Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading && tickers.length === 0 ? (
          [1, 2, 3, 4].map((n) => (
            <div key={n} className="p-3 rounded-2xl h-24 skeleton-shimmer border border-white/5" />
          ))
        ) : (
          tickers.map((ticker) => (
            <div
              key={ticker.symbol}
              style={{ backgroundColor: 'var(--bg-card-inner)' }}
              className="p-3 rounded-2xl flex flex-col justify-between border border-white/5 bento-card-spotlight group"
            >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 truncate pr-1" title={ticker.name}>
                {ticker.symbol}
              </span>
              {ticker.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
            </div>

            <div className="text-base font-bold text-white font-mono my-1 tracking-tight">
              {(ticker as any).currencySymbol || '$'}{ticker.price >= 100 ? ticker.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ticker.price.toFixed(2)}
            </div>

            <div className="flex items-center justify-between">
              <div className={`text-xs font-semibold font-mono ${ticker.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {ticker.isPositive ? '+' : ''}{ticker.change.toFixed(2)} ({ticker.isPositive ? '+' : ''}{ticker.changePercent.toFixed(2)}%)
              </div>
              {ticker.volume && (
                <div className="text-[11px] text-neutral-400 font-medium font-mono uppercase hidden sm:block">
                  Vol: {ticker.volume}
                </div>
              )}
            </div>
          </div>
        ))
      )}
      </div>

      {/* EDIT & SEARCH MARKET TICKERS MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#1C1B1B] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 flex items-center justify-center font-bold">
                  <Search className="w-4 h-4 text-[var(--accent-primary)]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Catálogo & Buscador de Tickers</h3>
                  <p className="text-xs text-slate-400">Encuentra o agrega cualquier acción, commodity, índice o divisa para tu empresa.</p>
                </div>
              </div>

              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* INSTANT SEARCH FILTER BAR */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar ticker (ej: Oro, Plata, Cobre, Petrol, Nvidia, Apple, Dólar, USD/COP, S&P)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#2A2A2A] border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[var(--accent-primary)] font-mono"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-[#2A2A2A] text-slate-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results / Presets Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider block">
                  Resultados del Catálogo ({filteredLibrary.length})
                </label>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors cursor-pointer"
                  title="Restablecer tickers por defecto"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restablecer</span>
                </button>
              </div>

              {filteredLibrary.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredLibrary.map((preset) => {
                    const isActive = tickers.some((t) => t.symbol === preset.symbol);
                    return (
                      <button
                        key={preset.symbol}
                        type="button"
                        onClick={() => handleTogglePreset(preset)}
                        className={`p-2.5 rounded-2xl text-left border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isActive
                            ? 'bg-[var(--accent-primary-subtle)] border-[var(--accent-primary)] text-white'
                            : 'bg-[#2A2A2A] border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-xs font-mono text-white block truncate">
                            {preset.symbol}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">{preset.name}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-white">${preset.price}</span>
                          {isActive ? (
                            <span className="p-1 rounded-full bg-[var(--accent-primary)] text-white">
                              <Check className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-full bg-white/10 text-slate-400">
                              <Plus className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#2A2A2A] border border-white/10 text-center space-y-3">
                  <p className="text-xs text-slate-400">
                    No se encontró ningún activo en el catálogo con el término <strong className="text-white">"{searchQuery}"</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleQuickAddSearched(searchQuery)}
                    className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar "{searchQuery.toUpperCase()}" con 1-Clic</span>
                  </button>
                </div>
              )}
            </div>

            {/* Active Tickers List */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <label className="text-xs font-bold text-white uppercase tracking-wider block">
                Activos Visibles en el Panel de tu Empresa ({tickers.length})
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tickers.map((ticker) => (
                  <div
                    key={ticker.symbol}
                    className="p-3 rounded-2xl bg-[#2A2A2A] border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-xs font-mono font-bold text-white shrink-0">
                        {ticker.symbol.substring(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-white block truncate">{ticker.symbol}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{ticker.name}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTicker(ticker.symbol)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                      title="Eliminar ticker"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Custom Ticker Form */}
            <form onSubmit={handleAddCustomTicker} className="space-y-3 pt-4 border-t border-white/10">
              <label className="text-xs font-bold text-white uppercase tracking-wider block">
                Agregar Nuevo Ticker / Activo Manual
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Símbolo (ej: COP/USD)"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#2A2A2A] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--accent-primary)] font-mono"
                  required
                />
                <input
                  type="text"
                  placeholder="Nombre (ej: Dólar Col)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#2A2A2A] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Precio Base (ej: 4050.50)"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#2A2A2A] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--accent-primary)] font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[var(--accent-primary-subtle)]"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Activo al Panel</span>
              </button>
            </form>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Guardar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

