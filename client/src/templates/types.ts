export type AnimationType = "snow" | "lights" | "stars";

export interface CardTemplate {
  id: number; // Obrigatório na aplicação final
  name: string;
  description: string;
  className: string; // Classe CSS principal
  accentColor: string; // Cor de botões e detalhes
  animation: AnimationType;
  preview: string; // Emoji de preview
  
  // Opcionais
  textColor?: string;
  overlayImage?: string;
}

// ADICIONE ESTA LINHA:
// Cria um tipo que tem tudo do CardTemplate, EXCETO o 'id'
export type CardTemplateDefinition = Omit<CardTemplate, "id">;