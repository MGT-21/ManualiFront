import api from "./api";
import type { Product, ProdutoApi, ProductDetails } from "@/types/product";

export async function buscarProdutosDestaque(limite = 8): Promise<Product[]> {
  const { data: produtos } = await api.get<ProdutoApi[]>("/products", {
    params: { limite },
  });

  return produtos.map((product) => ({
    id: product.id,
    name: product.nome,
    description: product.descricao,
    price: product.preco,
    image: product.fotos[0],
  }));
}