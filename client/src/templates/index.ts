// client/src/templates/index.ts
import { CardTemplate } from "./types";

// Exporta tipos para uso global
export * from "./types";

// 1. Carregamento Automático de Estilos (CSS)
// O { eager: true } garante que o CSS seja injetado no bundle imediatamente ao carregar a página.
// Não precisamos atribuir a uma variável, o simples import executa o CSS (side-effect).
import.meta.glob('./styles/*.css', { eager: true });

// 2. Carregamento Automático de Definições (TS)
// Importa todos os arquivos .ts dentro de definitions
const definitionsModules = import.meta.glob('./definitions/*.ts', { eager: true });

// 3. Processamento da Lista
export const AVAILABLE_TEMPLATES: CardTemplate[] = Object.values(definitionsModules)
  .map((module: any) => {
    // Como seus arquivos usam 'export const Nome = ...' (Named Export),
    // precisamos pegar o valor desse export.
    // Object.values(module)[0] pega o primeiro export encontrado no arquivo.
    return Object.values(module)[0] as CardTemplate;
  })
  // Filtra possíveis undefined ou arquivos que não exportam um template válido
  .filter((template) => template && typeof template.id === 'number')
  // Ordena por ID para garantir que a ordem na UI não mude aleatoriamente
  .sort((a, b) => a.id - b.id);

// Helpers usados no CardView.tsx (mantido igual)
export const getTemplateById = (id: number): CardTemplate => {
  return AVAILABLE_TEMPLATES.find(t => t.id === id) || AVAILABLE_TEMPLATES[0];
};