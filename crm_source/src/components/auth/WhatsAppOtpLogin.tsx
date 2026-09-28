'use client';

import React, { useState } from 'react';
import { Smartphone, Lock, ArrowRight, ShieldCheck, CheckCircle, RefreshCw, KeyRound, Sparkles } from 'lucide-react';

interface WhatsAppOtpLoginProps {
  onSuccess: (user: any) => void;
  onCancel?: () => void;
}

export default function WhatsAppOtpLogin({ onSuccess, onCancel }: WhatsAppOtpLoginProps) {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [devPreviewCode, setDevPreviewCode] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await fetch('/api/auth/whatsapp-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (data.success) {
        setStep('OTP');
        setInfoMessage(data.message);
        if (data.devPreviewCode) {
          setDevPreviewCode(data.devPreviewCode);
        }
      } else {
        setError(data.error || 'Failed to send OTP code');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/whatsapp-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otpCode }),
      });
      const data = await res.json();

      if (data.success) {
        onSuccess(data.user);
      } else {
        setError(data.error || 'Invalid code');
      }
    } catch (err: any) {
      setError(err.message || 'Verification error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
      <div
        style={{ backgroundColor: 'var(--bg-card)' }}
        className="w-full max-w-md p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl relative overflow-hidden"
      >
        {/* Top Branding Accent */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
            <Smartphone className="w-8 h-8 text-slate-950" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            WhatsApp Passwordless Login
          </h2>
          <p className="text-xs text-slate-400">
            Enterprise Multi-Tenant Security Engine
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center">
            {infoMessage}
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-300 tracking-wider">
                WhatsApp Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="+57 300 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-4 pr-4 py-3.5 rounded-2xl bg-slate-900 border border-white/10 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Enter your WhatsApp phone number. We will send a 6-digit single-use login code directly to your WhatsApp.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 transform active:scale-95"
              >
                {loading ? 'Sending Code...' : 'Send WhatsApp Security Code'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-slate-300 tracking-wider">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep('PHONE')}
                  className="text-[11px] text-amber-400 hover:underline font-bold"
                >
                  Change Phone
                </button>
              </div>

              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full py-3.5 text-center tracking-[0.5em] text-2xl font-mono font-black rounded-2xl bg-slate-900 border border-white/10 text-emerald-400 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 transform active:scale-95"
              >
                {loading ? 'Verifying...' : 'Verify Code & Sign In'}
                <ShieldCheck className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleSendOtp}
                className="w-full text-center text-xs text-slate-400 hover:text-white font-bold flex items-center justify-center gap-1 py-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Resend Code via WhatsApp
              </button>
            </div>
          </form>
        )}

        {onCancel && (
          <div className="pt-2 text-center">
            <button
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-300 font-bold"
            >
              Continue without signing in (Demo Mode)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
