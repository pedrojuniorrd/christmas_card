import { CardTemplate} from "./types";

export * from "./types";

// 1. Carrega estilos (CSS) automaticamente
import.meta.glob('./styles/*.css', { eager: true });

// 2. Carrega definições (TS)
// Usamos Record<string, any> pois o import.meta.glob retorna caminhos como chaves
const modules = import.meta.glob('./definitions/*.ts', { eager: true });

// 3. Processamento Dinâmico com IDs Determinísticos
export const AVAILABLE_TEMPLATES: CardTemplate[] = Object.entries(modules)
  // ORDENAÇÃO É CRUCIAL:
  // Ordenamos pelo caminho do arquivo (ex: ./definitions/aurora.ts vem antes de ./definitions/classic.ts)
  // Isso garante que 'aurora.ts' sempre receba o mesmo ID (ex: 1), independente da ordem de carregamento do sistema.
  .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
  .map(([path, module]: [string, any], index) => {
    // Extrai o export do arquivo (assumindo que é o primeiro/único export)
    const definition = Object.values(module)[0]; 

    if (!definition || !definition.name) {
      console.warn(`Template inválido encontrado em: ${path}`);
      return null;
    }

    // A MÁGICA ACONTECE AQUI:
    // O ID vira o índice + 1. Sem conflitos, sem duplicatas.
    return {
      ...definition,
      id: index + 1 
    };
  })
  .filter((t): t is CardTemplate => t !== null); // Remove possíveis nulos

// Helpers
export const getTemplateById = (id: number): CardTemplate => {
  return AVAILABLE_TEMPLATES.find(t => t.id === id) || AVAILABLE_TEMPLATES[0];
};