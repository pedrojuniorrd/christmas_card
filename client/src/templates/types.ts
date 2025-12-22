export type AnimationType = "snow" | "lights" | "stars";

export interface CardTemplate {
  id: number;
  name: string;
  description: string;
  className: string; // Classe CSS principal
  accentColor: string; // Cor de botões e detalhes
  animation: AnimationType;
  preview: string; // Emoji de preview
  
  // Opcionais para customização avançada
  textColor?: string;
  overlayImage?: string;
}