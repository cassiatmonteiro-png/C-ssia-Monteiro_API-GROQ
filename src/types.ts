export interface MaterialItem {
  id: string;
  nome: string;
  codigo?: string;
  categoria: string;
  quantidade: number;
  estoque_minimo: number;
  preco_unitario: number;
  localizacao?: string;
  descricao?: string;
  created_at: string;
  updated_at: string;
}

export type CategoryOption = 
  | 'CADERNO E PAPEIS'
  | 'ESCRITA E CORREÇÃO'
  | 'PINTURA E DESENHO'
  | 'MOCHILA E ESTOJO';

export const CATEGORIAS_PADRAO: CategoryOption[] = [
  'CADERNO E PAPEIS',
  'ESCRITA E CORREÇÃO',
  'PINTURA E DESENHO',
  'MOCHILA E ESTOJO'
];

/**
 * Normaliza e mapeia categorias antigas ou variações para as 4 categorias oficiais,
 * garantindo que nenhum item cadastrado anteriormente seja perdido.
 */
export function normalizeCategory(rawCategory: string): CategoryOption {
  if (!rawCategory) return 'CADERNO E PAPEIS';
  const clean = rawCategory
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

  if (clean.includes('CADERNO') || clean.includes('PAPEL') || clean.includes('PAPEIS') || clean.includes('BLOCO')) {
    return 'CADERNO E PAPEIS';
  }
  if (clean.includes('ESCRIT') || clean.includes('CORREC') || clean.includes('CANETA') || clean.includes('LAPIS') || clean.includes('BORRACHA') || clean.includes('APONTADOR')) {
    return 'ESCRITA E CORREÇÃO';
  }
  if (clean.includes('PINT') || clean.includes('DESENH') || clean.includes('TINTA') || clean.includes('PINCEL') || clean.includes('GIZ') || clean.includes('AQUARELA')) {
    return 'PINTURA E DESENHO';
  }
  if (clean.includes('MOCHIL') || clean.includes('ESTOJ') || clean.includes('LANCHEIR') || clean.includes('BOLSA')) {
    return 'MOCHILA E ESTOJO';
  }
  if (clean.includes('TESOUR') || clean.includes('COLA') || clean.includes('REGUA') || clean.includes('GEOMETR')) {
    return 'ESCRITA E CORREÇÃO';
  }

  return 'CADERNO E PAPEIS';
}

export type AppMode = 'comprador' | 'vendedor';

export interface CartItem {
  item: MaterialItem;
  quantidadeDesejada: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName: string;
  isConnected: boolean;
}

export interface GroqConfig {
  apiKey: string;
  model: string;
  temperature: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export type StockStatusFilter = 'todos' | 'normal' | 'baixo' | 'esgotado';
