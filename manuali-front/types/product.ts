export interface ProductApiData {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  ativo: boolean;
  categoria: string;
  fotos: string[];
  descricao: string;
  historia: string;
  artesaoId: string;
}

export type ProductCardData = Pick<
  ProductApiData,
  "id" | "nome" | "preco" | "fotos" | "descricao"
>;

// Filtros aceitos por GET /api/products/search
export interface ProductSearchParams {
  nome?: string; // busca pelo nome, sem diferenciar maiúsculas/minúsculas
  categoria?: string; // categoria que contenha o texto informado
  ativo?: boolean; // true = ativos, false = inativos
}

export type ProductSort = "mais-vendido" | "menor-preco" | "maior-preco";