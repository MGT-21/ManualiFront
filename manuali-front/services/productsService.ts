import { api } from "./api";
import type { ProductApiData } from "@/types/product";

export async function getAllProducts(limite?: number): Promise<ProductApiData[]> {
  const { data } = await api.get<ProductApiData[]>("/products");

  // sem limite, retorna todos
  return limite === undefined ? data : data.slice(0, limite);
}

export async function getProductById(id: string): Promise<ProductApiData> {
  const { data } = await api.get<ProductApiData>(`/products/${encodeURIComponent(id)}`);

  return data;
}