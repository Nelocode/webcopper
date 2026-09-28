'use client';

import React, { useState } from 'react';
import { Calendar, MapPin, Plus, User, CheckCircle2, Clock, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  company?: string;
}

interface SummitMeeting {
  id: string;
  time: string;
  contactName: string;
  company: string;
  location: string;
  topic: string;
  status: 'Programada' | 'Completada' | 'Seguimiento Enviado';
}

interface RoadshowEvent {
  id: string;
  summitName: string;
  city: string;
  country: string;
  dates: string;
  boothNumber: string;
  meetings: SummitMeeting[];
}

interface RoadshowManagerProps {
  contacts: any[];
  onOpen360: (contact: any) => void;
}

export const RoadshowManager: React.FC<RoadshowManagerProps> = ({ contacts, onOpen360 }) => {
  const [events, setEvents] = useState<RoadshowEvent[]>([
    {
      id: 'summit-1',
      summitName: 'PDAC 2026 International Convention',
      city: 'Toronto',
      country: 'Canadá',
      dates: '01 - 04 de Marzo, 2026',
      boothNumber: 'Metro Toronto Convention Centre - Stand #2408',
      meetings: [
        {
          id: 'm-1',
          time: '09:30 AM',
          contactName: 'Michael Sterling',
          company: 'Sterling Family Office',
          location: 'Booth #2408 Meeting Room A',
          topic: 'Revisión de resultados de leyes de plata en Santa Ana',
          status: 'Completada',
        },
        {
          id: 'm-2',
          time: '02:00 PM',
          contactName: 'Elena Rostova',
          company: 'Rostova Capital Mining Fund',
          location: 'Fairmont Royal York Suite 412',
          topic: 'Presentación del modelo de bloques y estimación de recursos',
          status: 'Programada',
        },
      ],
    },
    {
      id: 'summit-2',
      summitName: 'Beaver Creek Precious Metals Summit',
      city: 'Beaver Creek, Colorado',
      country: 'EE. UU.',
      dates: '15 - 18 de Septiembre, 2026',
      boothNumber: 'Park Hyatt Beaver Creek - Table #14',
      meetings: [
        {
          id: 'm-3',
          time: '11:00 AM',
          contactName: 'Patricia Gomez',
          company: 'Gomez Global Mining Brokers',
          location: 'Table #14',
          topic: 'Estrategia de distribución institucional de colocación privada',
          status: 'Seguimiento Enviado',
        },
      ],
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [summitName, setSummitName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Canadá');
  const [dates, setDates] = useState('');
  const [boothNumber, setBoothNumber] = useState('');

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summitName || !city) return;

    const newEvent: RoadshowEvent = {
      id: `summit-${Date.now()}`,
      summitName,
      city,
      country,
      dates,
      boothNumber,
      meetings: [],
    };

    setEvents([...events, newEvent]);
    setShowCreateModal(false);
    setSummitName('');
    setCity('');
    setDates('');
    setBoothNumber('');
  };

  return (
    <div className="space-y-6 font-['Urbanist'] w-full animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Calendar style={{ color: 'var(--primary-color)' }} className="w-5 h-5" />
              <span>Gestor de Roadshows & Cumbres Mineras Internacionales</span>
            </h2>
            <span
              style={{ backgroundColor: 'var(--primary-color)', color: '#000000' }}
              className="px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase shadow-md"
            >
              ROADSHOWS & SUMMITS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Planificación de itinerarios de reuniones 1 a 1 en cumbres del sector (PDAC Toronto, Beaver Creek, Denver Gold).
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{ backgroundColor: 'var(--primary-color)', color: '#000000' }}
          className="px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 hover:scale-105 cursor-pointer shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nueva Cumbre / Evento</span>
        </button>
      </div>

      {/* Summits List */}
      <div className="space-y-6">
        {events.map((event) => (
          <div
            key={event.id}
            style={{ backgroundColor: 'var(--bg-card)' }}
            className="rounded-3xl p-6 border border-white/10 space-y-5 shadow-2xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">{event.summitName}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-bold mt-1">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.city}, {event.country}
                  </span>
                  <span>•</span>
                  <span>{event.dates}</span>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-2xl bg-slate-950 border border-white/10 text-xs font-mono text-slate-300">
                🏢 {event.boothNumber}
              </div>
            </div>

            {/* Meetings Table */}
            <div>
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Itinerario de Reuniones 1 a 1 Programadas ({event.meetings.length})</span>
              </h4>

              <div className="space-y-2.5">
                {event.meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-black shrink-0">
                        {meeting.time}
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">{meeting.contactName} ({meeting.company})</div>
                        <div className="text-[11px] text-slate-400 font-medium">{meeting.topic}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                          meeting.status === 'Completada'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : meeting.status === 'Seguimiento Enviado'
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {meeting.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c0e17] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 font-['Urbanist']">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-tight">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Registrar Cumbre Minera / Roadshow</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-300 mb-1 uppercase tracking-wider">
                  Nombre de la Cumbre / Convención
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: PDAC 2026 Toronto"
                  value={summitName}
                  onChange={(e) => setSummitName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1 uppercase tracking-wider">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Toronto"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1 uppercase tracking-wider">
                    País
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Canadá"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 mb-1 uppercase tracking-wider">
                  Fechas del Evento
                </label>
                <input
                  type="text"
                  placeholder="Ej: 01 - 04 de Marzo, 2026"
                  value={dates}
                  onChange={(e) => setDates(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 mb-1 uppercase tracking-wider">
                  Ubicación Stand / Mesa
                </label>
                <input
                  type="text"
                  placeholder="Ej: Stand #2408 Metro Toronto Convention Centre"
                  value={boothNumber}
                  onChange={(e) => setBoothNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-900 text-slate-400 hover:text-white font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-[#00dfdf] text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-lg"
                >
                  Registrar Cumbre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
