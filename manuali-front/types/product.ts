export interface ProdutoApi {
  id: number;
  nome: string;
  preco: number;
  estoque: number;
  ativo: boolean;
  categoria: string;
  fotos: string[];
  descricao: string;
  historia: string;
  artesaoId: number;
  mediaAvaliacoes: number;
  totalAvaliacoes: number;
}

export interface ProdutoDestaqueApi {
  id: number;
  nome: string;
  preco: number;
  imagem: string;
  categoria: string;
  estoque: number;
  mediaAvaliacoes: number;
  totalAvaliacoes: number;
  artesaoId: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image: string;
}

export interface ProductDetails extends Product {
  category: string;
  stock: number;
  images: string[];
  story: string;
  artisanId: number;
}