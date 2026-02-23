export const Colors = {
  // Backgrounds
  background: '#F4F1E8',          // warm parchment
  surface: '#FFFFFF',              // white cards
  surfaceElevated: '#FAF8F3',     // slightly elevated off-white
  border: '#C9B896',              // warm gold-tan border
  borderSubtle: '#E0D6C3',        // subtle warm border

  // Text
  text: '#2C1810',                // deep brown-black
  textMuted: '#7A6652',           // muted warm brown
  textDim: '#A69882',             // dim warm tone
  textOnColor: '#FFFFFF',         // white text on colored backgrounds

  // Accents
  accent: '#B5945B',              // muted gold — icons, decorative elements
  accentDim: '#F0E8D8',           // light gold tint background

  // Burgundy — primary action color
  burgundy: '#5C1D1D',            // deep burgundy — active buttons, CTA
  burgundyLight: '#7A2E2E',       // lighter burgundy for hover/press
  burgundyDim: '#F5EAEA',         // light burgundy tint

  // Speaker colors
  priest: '#5C1D1D',              // burgundy for priest
  deacon: '#4A6D8C',             // muted blue for deacon
  congregation: '#2C1810',        // dark brown for congregation
  rubric: '#8B7355',              // warm muted for rubric/instructions

  // Decorative
  goldSeal: '#B5945B',            // gold seal background
  goldSealBorder: '#9A7D4A',      // darker gold border for seal
  frameOuter: '#C9B896',          // card frame outer border
  frameInner: '#D4C5A9',          // card frame inner border

  // Presentation mode (stays dark)
  presentationBg: '#0a0a0a',
  presentationSurface: '#111111',
  presentationBorder: '#1e1e1e',
  presentationText: '#ffffff',
  presentationTextMuted: '#666666',
  presentationTextDim: '#444444',
  presentationDeacon: '#7B9FC4',  // lighter blue for deacon in dark mode
};

/** Speaker role colors for the reading view (light theme). */
export const speakerColors: Record<string, string> = {
  priest: Colors.priest,
  deacon: Colors.deacon,
  congregation: Colors.congregation,
  all: Colors.text,
};

/** Speaker role colors for presentation mode (dark theme). */
export const presentationSpeakerColors: Record<string, string> = {
  priest: Colors.accent,
  deacon: Colors.presentationDeacon,
  congregation: Colors.presentationText,
  all: Colors.presentationText,
};
