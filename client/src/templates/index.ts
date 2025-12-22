import { CardTemplate } from "./types";

// Importa os templates individuais
import { ClassicRed } from "./definitions/classic-red";
import { Evergreen } from "./definitions/evergreen";
import { GoldenGlow } from "./definitions/golden-glow";
import { SilentNight } from "./definitions/silent-night";
import { FrozenWinter } from "./definitions/frozen-winter";
import { AuroraBorealis } from "./definitions/aurora-borealis";
// Exporta tipos para uso global
export * from "./types";

// Lista oficial usada no CreateCard.tsx para gerar os botões
export const AVAILABLE_TEMPLATES: CardTemplate[] = [
  ClassicRed,
  Evergreen,
  GoldenGlow,
  SilentNight,
  FrozenWinter,
  AuroraBorealis,
];

// Helpers usados no CardView.tsx
export const getTemplateById = (id: number): CardTemplate => {
  return AVAILABLE_TEMPLATES.find(t => t.id === id) || AVAILABLE_TEMPLATES[0];
};