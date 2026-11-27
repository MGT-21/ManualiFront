import { api } from "./api";
import type { ProductApiData, ProductSearchParams } from "@/types/product";

export async function getAllProducts(limite?: number): Promise<ProductApiData[]> {
  const { data } = await api.get<ProductApiData[]>("/products");

  // sem limite, retorna todos
  return limite === undefined ? data : data.slice(0, limite);
}

export async function getProductById(id: string): Promise<ProductApiData> {
  const { data } = await api.get<ProductApiData>(`/products/${encodeURIComponent(id)}`);

  return data;
}

export async function searchProducts(
  params: ProductSearchParams = {},
  signal?: AbortSignal,
): Promise<ProductApiData[]> {
  const nome = params.nome?.trim();
  const categoria = params.categoria?.trim();

  const { data } = await api.get<ProductApiData[] | { data: ProductApiData[] }>(
    "/products/search",
    {
      signal,
      params: {
        nome: nome || undefined,
        categoria: categoria || undefined,
        ativo: params.ativo,
      },
    },
  );

  // aceita tanto [ ... ] quanto { data: [ ... ] }
  return Array.isArray(data) ? data : (data?.data ?? []);
}