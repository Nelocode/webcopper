'use client';

import React, { useState } from 'react';
import { Video, Mic, MicOff, VideoOff, Copy, Check, ExternalLink, ShieldCheck, PhoneOff, Users } from 'lucide-react';

interface RealWebRtcRoomProps {
  roomName?: string;
  contactName?: string;
  onClose: () => void;
}

export default function RealWebRtcRoom({
  roomName = 'OutcropSilver-IR-Executive',
  contactName,
  onClose,
}: RealWebRtcRoomProps) {
  const [copied, setCopied] = useState(false);
  const cleanRoomName = roomName.replace(/[^a-zA-Z0-9-]/g, '');
  const meetingUrl = `https://meet.jit.si/${cleanRoomName}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div
        style={{ backgroundColor: 'var(--bg-card)' }}
        className="w-full max-w-5xl h-[85vh] rounded-3xl border border-white/10 flex flex-col shadow-2xl overflow-hidden relative"
      >
        {/* Header Bar */}
        <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white">IR Live Video Conference Room</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  🔴 WebRTC Live
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {contactName ? `Meeting with ${contactName}` : `Room: ${cleanRoomName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Investor Invite Link'}</span>
            </button>

            <a
              href={meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Open in new window"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors font-bold text-xs flex items-center gap-1.5"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave Room</span>
            </button>
          </div>
        </div>

        {/* Live WebRTC IFrame Stream */}
        <div className="flex-1 bg-black relative">
          <iframe
            src={`${meetingUrl}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false`}
            allow="camera; microphone; display-capture; autoplay; clipboard-write"
            className="w-full h-full border-0"
            title="Jitsi Meet Live WebRTC Conference Room"
          />
        </div>
      </div>
    </div>
  );
}
