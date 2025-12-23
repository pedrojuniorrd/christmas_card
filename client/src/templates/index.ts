import { CardTemplate, CardTemplateDefinition } from "./types"; // Importe o novo tipo

export * from "./types";

// 1. Carrega estilos (CSS) automaticamente
import.meta.glob('./styles/*.css', { eager: true });

// 2. Carrega definições (TS)
// Usamos Record<string, any> pois o import.meta.glob retorna caminhos como chaves
const modules = import.meta.glob('./definitions/*.ts', { eager: true });

// 3. Processamento Dinâmico com IDs Determinísticos
export const AVAILABLE_TEMPLATES: CardTemplate[] = Object.entries(modules)
  .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
  .map(([path, module]: [string, any], index) => {
    // Força o TS a entender que isso é uma Definição (sem ID)
    const definition = Object.values(module)[0] as CardTemplateDefinition; 

    if (!definition || !definition.name) {
      console.warn(`Template inválido encontrado em: ${path}`);
      return null;
    }

    // Retorna o objeto completo (Definição + ID), que satisfaz CardTemplate
    return {
      ...definition,
      id: index + 1 
    };
  })
  .filter((t): t is CardTemplate => t !== null);

// Helpers
export const getTemplateById = (id: number): CardTemplate => {
  return AVAILABLE_TEMPLATES.find(t => t.id === id) || AVAILABLE_TEMPLATES[0];
};