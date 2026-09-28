// Outcrop Silver Tag System & Follow-up Flow Constants

export const OUTCROP_TAGS = {
  INVESTOR_TYPES: [
    "Retail investor",
    "Retail broker",
    "Retail VIP",
    "Retail influencer",
    "HNW investor",
    "Family office",
    "Institutional PM",
    "Institutional analyst",
    "Private equity PM",
    "Private equity analyst",
    "Brokerage - research",
    "Brokerage - banking",
    "Brokerage - sales",
    "Corporate strategic",
    "Royalty/streaming",
    "Newsletter",
    "Media",
    "Service company",
    "IR company",
    "Mining insider",
    "Competitor",
    "Government/regulatory",
    "Outcrop employee",
    "Legal/financial advisor",
    "Other",
  ],

  STAGES: [
    "Interested - early",
    "Interested - considering",
    "Interested - committed",
    "Interested - shareholder",
    "Former shareholder",
    "Not interested",
    "No response",
    "Do not contact",
  ],

  SOURCES: [
    "MailChimp/website",
    "Existing shareholder",
    "Transfer agent list",
    "Referral",
    "Conference",
    "Brokerage roadshow",
    "Financing",
    "Inbound email",
    "Inbound phone call",
    "Outbound campaign",
    "Networking",
    "Social media",
    "IR firm",
    "Purchased list",
    "Analyst referral",
    "Other",
  ],
} as const;

// Contact Follow-Up Flow Stages (Replacing Sales Pipeline)
export const FOLLOW_UP_STAGES = [
  { id: "First Contact", label: "Primer Contacto", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "Deck Sent", label: "Presentación / Deck Enviado", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { id: "Meeting Scheduled", label: "Reunión Agendada", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  { id: "Follow-up Pending", label: "Seguimiento Pendiente", color: "bg-lime-500/20 text-lime-400 border-lime-500/30" },
  { id: "Decision Made", label: "Decisión Tomada", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "Keep in Touch", label: "Mantener Contacto", color: "bg-zinc-700/50 text-zinc-300 border-zinc-600/30" },
];

export const STAGE_COLORS: Record<string, string> = {
  "Interested - early": "bg-lime-500/20 text-lime-400 border-lime-500/30",
  "Interested - considering": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "Interested - committed": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Interested - shareholder": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Former shareholder": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Not interested": "bg-zinc-800 text-zinc-400 border-zinc-700",
  "No response": "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "Do not contact": "bg-red-900/40 text-red-400 border-red-800/40",
};

export const INVESTOR_TYPE_COLORS: Record<string, string> = {
  "Retail investor": "bg-zinc-800 text-zinc-300",
  "Retail broker": "bg-cyan-500/20 text-cyan-300",
  "Retail VIP": "bg-amber-500/20 text-amber-300 font-bold",
  "HNW investor": "bg-lime-500/20 text-lime-300 font-bold",
  "Family office": "bg-purple-500/20 text-purple-300 font-bold",
  "Institutional PM": "bg-emerald-500/20 text-emerald-300 font-bold",
  "Institutional analyst": "bg-teal-500/20 text-teal-300",
  "Private equity PM": "bg-indigo-500/20 text-indigo-300",
  "Outcrop employee": "bg-pink-500/20 text-pink-300",
};
