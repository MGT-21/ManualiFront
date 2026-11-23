import api from "./api";
import type { Product, ProdutoApi } from "@/types/product";

export async function buscarProdutosDestaque(limite = 8): Promise<Product[]> {
  const { data: products } = await api.get<ProdutoApi[]>("produtos", {
    params: { limite },
  });

  return products.map((product) => ({
    id: product.id,
    name: product.nome,
    description: product.descricao,
    price: product.preco / 100,
    image: product.fotos[0],
  }));
}