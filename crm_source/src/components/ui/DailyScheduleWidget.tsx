'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ArrowUpRight } from 'lucide-react';

interface DailyScheduleWidgetProps {
  onOpenAgenda: () => void;
}

export const DailyScheduleWidget: React.FC<DailyScheduleWidgetProps> = ({ onOpenAgenda }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/calendar/events');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error('Error fetching calendar events:', e);
    } finally {
      setLoading(false);
    }
  };

  const nextEvent = events[0];
  const upcomingCount = events.length;

  return (
    <div
      onClick={onOpenAgenda}
      className="p-6 rounded-md bg-[#1C1B1B] border border-white/10 cursor-pointer group transition-all hover:bg-[#2A2A2A] flex flex-col justify-between select-none"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 text-white flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[var(--accent-primary)]" />
            </div>
            <span className="text-sm font-bold text-white uppercase tracking-wider">Live Calendar</span>
          </div>

          <span className="px-2 py-0.5 rounded bg-white/5 text-[#A1A1A1] border border-white/10 font-mono text-[11px]">
            {upcomingCount} Synced
          </span>
        </div>

        {/* Date Display */}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-4xl font-bold text-white font-mono">
            {new Date().getDate()}
          </span>
          <span className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-widest font-mono">
            {new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Real Event or Fallback */}
        {nextEvent ? (
          <div className="p-3 rounded-md bg-[#2A2A2A] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xs font-mono font-bold text-white">
                {new Date(nextEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate max-w-[140px]">
                  {nextEvent.title}
                </div>
                <div className="text-[11px] font-medium text-[#A1A1A1] truncate">
                  {nextEvent.contact?.name || 'Investor Meeting'}
                </div>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] border border-red-500/20 text-[10px] font-mono uppercase">
              Live
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-md bg-[#2A2A2A] border border-white/10 text-center text-xs font-medium text-[#A1A1A1]">
            No meetings scheduled for today
          </div>
        )}
      </div>

      {/* Footer trigger */}
      <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-[#A1A1A1] group-hover:text-white transition-colors">
        <span>Sync Calendar & iCal Feed</span>
        <ArrowUpRight className="w-4 h-4 text-[var(--accent-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </div>
    </div>
  );
};
