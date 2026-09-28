import { Contact } from '@/types/crm';

export interface ScoringRuleConfig {
  baseScore: number;
  investorTypes: Record<string, number>;
  stages: Record<string, number>;
  voiceNoteBonus: number;
  activityBonus: number;
  documentBonus: number;
  relationshipBonus: number;
  tagBonus: Record<string, number>;
}

export const DEFAULT_SCORING_RULES: ScoringRuleConfig = {
  baseScore: 20,
  investorTypes: {
    'Private Equity PM': 30,
    'Private equity analyst': 25,
    'Institutional PM': 30,
    'Institutional analyst': 25,
    'Family office': 25,
    'HNW investor': 20,
    'Retail VIP': 20,
    'Brokerage - research': 15,
    'Brokerage - banking': 15,
    'Corporate strategic': 20,
    'Retail broker': 10,
    'Retail investor': 5,
  },
  stages: {
    'Interested - shareholder': 40,
    'Interested - committed': 35,
    'Interested - considering': 25,
    'Interested - early': 15,
    'Former shareholder': 10,
  },
  voiceNoteBonus: 10,
  activityBonus: 5,
  documentBonus: 10,
  relationshipBonus: 15,
  tagBonus: {
    '⚡ Alta Prioridad': 25,
    '⛏️ Proyecto Plata': 15,
    '🌐 LatAm Hub': 15,
    '📈 Pre-IPO': 20,
    '💎 Strategic Lead': 25,
  },
};

export function calculateContactScore(contact: any, rules: ScoringRuleConfig = DEFAULT_SCORING_RULES): number {
  let score = rules.baseScore || 20;

  // 1. Investor Type Bonus
  if (contact.investorType && rules.investorTypes && rules.investorTypes[contact.investorType] !== undefined) {
    score += rules.investorTypes[contact.investorType];
  } else if (contact.investorType) {
    score += 15;
  }

  // 2. Stage Bonus
  if (contact.stage && rules.stages && rules.stages[contact.stage] !== undefined) {
    score += rules.stages[contact.stage];
  } else if (contact.stage) {
    score += 10;
  }

  // 3. Voice Notes Bonus (Interacciones)
  const voiceNoteCount = contact.voiceNotes?.length || 0;
  score += Math.min(voiceNoteCount * (rules.voiceNoteBonus || 10), 30);

  // 4. Activities Bonus
  const activityCount = (contact.activities?.length || 0) + (contact.timelineActivities?.length || 0);
  score += Math.min(activityCount * (rules.activityBonus || 5), 25);

  // 5. Documents Bonus
  const docCount = (contact.documents?.length || 0) + (contact.cards?.length || 0);
  score += Math.min(docCount * (rules.documentBonus || 10), 20);

  // 6. Network Relationships (Eslabón de Red)
  const relCount = (contact.sourceRelationships?.length || 0) + (contact.targetRelationships?.length || 0);
  score += Math.min(relCount * (rules.relationshipBonus || 15), 45);

  // 7. Custom Tags Bonus
  if (Array.isArray(contact.tags)) {
    contact.tags.forEach((tag: string) => {
      if (rules.tagBonus && rules.tagBonus[tag] !== undefined) {
        score += rules.tagBonus[tag];
      }
    });
  }

  // Clamp score between 0 and 100
  return Math.min(Math.max(score, 0), 100);
}
