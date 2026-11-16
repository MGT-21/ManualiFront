export interface ProdutoApi {
  id: number;
  nome: string;
  preco: number;
  estoque: number;
  ativo: boolean;
  categoria: string;
  fotos: string[];
  descricao?: string;
  historia?: string;
  artesaoId: number;
}

