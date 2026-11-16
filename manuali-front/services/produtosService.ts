import api from "./api";
import type { ArtesaoApi, Produto, ProdutoApi } from "@/types/produto";

export async function buscarProdutosDestaque(limite = 8): Promise<Produto[]> {
  const [{ data: produtos }, { data: artesaos }] = await Promise.all([
    api.get<ProdutoApi[]>("/recomendacoes/destaque", { params: { limite } }),
    api.get<ArtesaoApi[]>("/artesaos"),
  ]);
  const nomesArtesaos = new Map(
    artesaos.map((artesao) => [artesao.id, artesao.username]),
  );

  return produtos.map((produto) => {
    const artesao = nomesArtesaos.get(produto.artesaoId);
    if (!artesao) {
      throw new Error(`Artesão ${produto.artesaoId} não encontrado.`);
    }

    return {
      id: produto.id,
      nome: produto.nome,
      artesao,
      preco: produto.preco,
      imagem: produto.fotos[0],
    };
  });
}