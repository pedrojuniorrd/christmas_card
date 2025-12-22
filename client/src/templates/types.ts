export type AnimationType = "snow" | "lights" | "stars";

export interface CardTemplate {
  name: string;
  description: string;
  className: string;
  accentColor: string;
  animation: AnimationType;
  preview: string;
  textColor?: string;
  overlayImage?: string;
}

export interface CardTemplate {
  id: number; // O ID será injetado dinamicamente
}