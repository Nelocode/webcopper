export interface CustomThemeConfig {
  id?: string;
  name?: string;
  primaryColor: string;
  secondaryColor: string;
  bgMain: string;
  bgCard: string;
  bgCardHover: string;
  bgCardInner: string;
  textColor: string;
  textSecondary: string;
  borderColor: string;
  glowColor: string;
  fontFamily: string;
  monoFontFamily: string;
  borderRadius: string; // e.g. '28px', '16px', '8px'
  backdropBlur: string; // e.g. '16px', '8px', '0px'
}

export const DEFAULT_THEME_CONFIG: CustomThemeConfig = {
  id: 'outcrop-silver',
  name: 'Outcrop Silver Official',
  primaryColor: '#00dfdf',
  secondaryColor: '#a9aeb2',
  bgMain: '#0f172a',
  bgCard: '#1e2430',
  bgCardHover: '#282f40',
  bgCardInner: '#282f40',
  textColor: '#ffffff',
  textSecondary: '#a9aeb2',
  borderColor: 'rgba(0, 223, 223, 0.15)',
  glowColor: 'rgba(0, 223, 223, 0.4)',
  fontFamily: "'Urbanist', sans-serif",
  monoFontFamily: "'JetBrains Mono', monospace",
  borderRadius: '28px',
  backdropBlur: '16px',
};

export const THEME_PRESETS: CustomThemeConfig[] = [
  {
    id: 'outcrop-silver',
    name: 'Outcrop Silver Official (Cyan & Acero)',
    primaryColor: '#00dfdf',
    secondaryColor: '#a9aeb2',
    bgMain: '#0f172a',
    bgCard: '#1e2430',
    bgCardHover: '#282f40',
    bgCardInner: '#282f40',
    textColor: '#ffffff',
    textSecondary: '#a9aeb2',
    borderColor: 'rgba(0, 223, 223, 0.2)',
    glowColor: 'rgba(0, 223, 223, 0.4)',
    fontFamily: "'Urbanist', sans-serif",
    monoFontFamily: "'JetBrains Mono', monospace",
    borderRadius: '28px',
    backdropBlur: '16px',
  },
  {
    id: 'crimson-executive',
    name: 'Crimson Executive (Rojo Neón & Obsidiana)',
    primaryColor: '#ff2a2a',
    secondaryColor: '#ff5555',
    bgMain: '#07070a',
    bgCard: '#121218',
    bgCardHover: '#1a1a24',
    bgCardInner: '#1a1a24',
    textColor: '#ffffff',
    textSecondary: '#a1a1aa',
    borderColor: 'rgba(255, 42, 42, 0.25)',
    glowColor: 'rgba(255, 42, 42, 0.4)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    monoFontFamily: "'Space Mono', monospace",
    borderRadius: '24px',
    backdropBlur: '20px',
  },
  {
    id: 'gold-syndicate',
    name: 'Gold Exploration (Oro Dorado & Carbón)',
    primaryColor: '#d4af37',
    secondaryColor: '#f59e0b',
    bgMain: '#0b0b0d',
    bgCard: '#16161a',
    bgCardHover: '#22222a',
    bgCardInner: '#22222a',
    textColor: '#ffffff',
    textSecondary: '#9ca3af',
    borderColor: 'rgba(212, 175, 55, 0.25)',
    glowColor: 'rgba(212, 175, 55, 0.4)',
    fontFamily: "'Outfit', sans-serif",
    monoFontFamily: "'JetBrains Mono', monospace",
    borderRadius: '16px',
    backdropBlur: '12px',
  },
  {
    id: 'deep-space',
    name: 'Titanium Deep Space (Violeta & Hielo)',
    primaryColor: '#a855f7',
    secondaryColor: '#06b6d4',
    bgMain: '#0a0518',
    bgCard: '#160e2e',
    bgCardHover: '#221742',
    bgCardInner: '#221742',
    textColor: '#ffffff',
    textSecondary: '#a7f3d0',
    borderColor: 'rgba(168, 85, 247, 0.25)',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    fontFamily: "'Space Grotesk', sans-serif",
    monoFontFamily: "'Fira Code', monospace",
    borderRadius: '28px',
    backdropBlur: '24px',
  },
  {
    id: 'emerald-prospector',
    name: 'Emerald Prospector (Verde Esmeralda)',
    primaryColor: '#10b981',
    secondaryColor: '#34d399',
    bgMain: '#060f0d',
    bgCard: '#101e1a',
    bgCardHover: '#182d27',
    bgCardInner: '#182d27',
    textColor: '#ffffff',
    textSecondary: '#6ee7b7',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    fontFamily: "'Inter', sans-serif",
    monoFontFamily: "'JetBrains Mono', monospace",
    borderRadius: '16px',
    backdropBlur: '12px',
  },
];

export function applyThemeConfig(config: CustomThemeConfig): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Set CSS Variables on :root
  root.style.setProperty('--primary-color', config.primaryColor);
  root.style.setProperty('--primary-color-hover', config.primaryColor);
  root.style.setProperty('--primary-color-alpha', config.glowColor || `${config.primaryColor}33`);
  root.style.setProperty('--accent-primary', config.primaryColor);
  root.style.setProperty('--accent-primary-hover', config.primaryColor);
  root.style.setProperty('--accent-primary-subtle', `${config.primaryColor}22`);
  root.style.setProperty('--secondary-color', config.secondaryColor);
  root.style.setProperty('--bg-main', config.bgMain);
  root.style.setProperty('--bg-card', config.bgCard);
  root.style.setProperty('--bg-card-hover', config.bgCardHover);
  root.style.setProperty('--bg-card-inner', config.bgCardInner);
  root.style.setProperty('--text-primary', config.textColor);
  root.style.setProperty('--text-secondary', config.textSecondary);
  root.style.setProperty('--border-color', config.borderColor);

  // Set Typography & Geometry
  root.style.setProperty('--font-family-main', config.fontFamily);
  root.style.setProperty('--font-family-mono', config.monoFontFamily);
  root.style.setProperty('--card-border-radius', config.borderRadius);
  root.style.setProperty('--backdrop-blur', config.backdropBlur);

  // Save to localStorage for instant recovery across reloads/navigations
  localStorage.setItem('crm_theme_config', JSON.stringify(config));
  localStorage.setItem('crm_primary_color', config.primaryColor);
  localStorage.setItem('crm_accent_purple', config.secondaryColor);
  localStorage.setItem('crm_bg_main', config.bgMain);
  localStorage.setItem('crm_bg_card', config.bgCard);
  localStorage.setItem('crm_bg_card_inner', config.bgCardInner);
  localStorage.setItem('crm_text_color', config.textColor);
}

export function initTheme(): CustomThemeConfig {
  if (typeof document === 'undefined') return DEFAULT_THEME_CONFIG;

  try {
    const savedConfig = localStorage.getItem('crm_theme_config');
    if (savedConfig) {
      const parsed: CustomThemeConfig = JSON.parse(savedConfig);
      applyThemeConfig(parsed);
      return parsed;
    }
  } catch (err) {
    console.error('Error loading theme config from storage:', err);
  }

  applyThemeConfig(DEFAULT_THEME_CONFIG);
  return DEFAULT_THEME_CONFIG;
}
