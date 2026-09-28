export interface Contact {
  id: string;
  name: string;
  title?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  location?: string | null;
  bio?: string | null;
  dynamicIcebreaker?: string | null;
  strategicContext?: string | null;
  relationshipScore?: number;
  investorType: string;
  interestLevel?: string | null;
  stage: string;
  source: string;
  customTags: string; // JSON string
  leadScore: number;
  createdAt: string;
  updatedAt: string;
  activities?: TimelineActivity[];
  timelineActivities?: TimelineActivity[];
  cards?: BusinessCard[];
  voiceNotes?: VoiceNote[];
  deals?: Deal[];
  quotes?: Quote[];
  documents?: Array<{ id: string; name: string; url?: string; createdAt?: string }>;
  sourceRelationships?: Relationship[];
  targetRelationships?: Relationship[];
}

export interface Relationship {
  id: string;
  sourceContactId: string;
  targetContactId: string;
  relationshipType: string;
  notes?: string | null;
  strength: number;
  sourceContact?: Contact;
  targetContact?: Contact;
}

export interface TimelineActivity {
  id: string;
  contactId: string;
  type: 'CALL' | 'EMAIL' | 'WHATSAPP' | 'STAGE_CHANGE' | 'SCORE_CHANGE' | 'VOICE_NOTE' | 'CARD_SCAN' | 'QUOTE_CREATED' | 'MEETING' | 'NOTE';
  title: string;
  description?: string | null;
  metadata?: string | null;
  createdAt: string;
}

export interface BusinessCard {
  id: string;
  contactId?: string | null;
  frontImageUrl: string;
  backImageUrl?: string | null;
  extractedTextFront?: string | null;
  extractedTextBack?: string | null;
  parsedDataJson?: string | null;
  createdAt: string;
}

export interface VoiceNote {
  id: string;
  contactId: string;
  audioDataUrl: string;
  durationSeconds: number;
  transcript?: string | null;
  createdAt: string;
}

export interface Deal {
  id: string;
  contactId: string;
  title: string;
  amount: number;
  currency: string;
  stage: string;
  probability: number;
  expectedCloseDate?: string | null;
  contact?: Contact;
  createdAt: string;
}

export interface Quote {
  id: string;
  dealId?: string | null;
  contactId: string;
  quoteNumber: string;
  itemsJson: string;
  totalAmount: number;
  status: string;
  contact?: Contact;
  createdAt: string;
}

export interface WorkflowRule {
  id: string;
  name: string;
  triggerType: string;
  triggerValue: string;
  actionType: string;
  actionValue: string;
  isActive: boolean;
  createdAt: string;
}
