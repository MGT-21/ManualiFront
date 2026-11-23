import api from "./api";
import type {
  Product,
  ProductDetails,
  ProdutoApi,
  ProdutoDestaqueApi,
} from "@/types/product";

interface ApiResponse<T> {
  data: T;
}

interface RecommendationApi {
  produto: ProdutoDestaqueApi;
}

function mapProduct(product: ProdutoDestaqueApi): Product {
  return {
    id: String(product.id),
    name: product.nome,
    description: "",
    price: product.preco,
    image: product.imagem,
  };
}

export async function buscarProdutosDestaque(limite = 8): Promise<Product[]> {
  const { data: response } = await api.get<ApiResponse<RecommendationApi[]>>(
    "/recomendacoes/destaque",
    {
      params: { limite },
    },
  );

  return response.data.map(({ produto }) => ({
    ...mapProduct(produto),
    description: produto.categoria,
  }));
}

export async function buscarProduto(id: string): Promise<ProductDetails> {
  const { data: response } = await api.get<ApiResponse<ProdutoApi>>(
    `/produtos/${encodeURIComponent(id)}`,
  );
  const product = response.data;
  const images = product.fotos;

  return {
    id: String(product.id),
    name: product.nome,
    description: product.descricao,
    price: product.preco,
    image: images[0] ?? "",
    category: product.categoria,
    stock: product.estoque,
    images,
    story: product.historia,
    artisanId: product.artesaoId,
  };
}

export async function buscarProdutosRelacionados(
  id: string,
  limite = 4,
): Promise<Product[]> {
  const { data: response } = await api.get<ApiResponse<RecommendationApi[]>>(
    `/produtos/${encodeURIComponent(id)}/recomendacoes`,
    {
      params: { limite },
    },
  );

  return response.data.map(({ produto }) => ({
    ...mapProduct(produto),
    description: produto.categoria,
  }));
}