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

export interface ArtesaoApi {
  id: number;
  username: string;
}

export interface Product {
  id: string;
  name: string;
  artisan?: string;
  description?: string;
  price: string;
  image: string;
}