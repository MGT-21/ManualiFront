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