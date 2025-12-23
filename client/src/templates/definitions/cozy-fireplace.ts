import { CardTemplate } from "../types";
import "../styles/cozy-fireplace.css"; // Importamos o CSS específico

export const CozyFireplace: CardTemplate = {
  id: 7, // Certifique-se que este ID é único
  name: "Cozy Fireplace",
  description: "O calor acolhedor de uma lareira de Natal",
  className: "christmas-gradient-fireplace",
  accentColor: "#FFD700", // Dourado para botões
  animation: "lights", // Luzes piscando combinam bem
  preview: "🔥",
  textColor: "#FFF8E7" // Um branco levemente amarelado para leitura
};