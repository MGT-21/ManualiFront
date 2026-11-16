"use client";

import { Footer } from "@/components/footer";
import { VisitantHeader } from "@/components/header";
import { HeroBanner } from "@/components/herobanner";
import { ProductCard } from "@/components/product-card";
import { SecaoDeCards } from "@/components/secao-de-cards";

import { useEffect, useState } from "react";
import { buscarProdutosDestaque } from "@/services/produtosService";
import type { Produto } from "@/types/produto";

// Textura de grão de papel para o fundo creme, subliminar (acabamento xilogravura)
const TEXTURA_PAPEL_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;



export default function HomeMarketplace() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    async function carregarProdutos() {
      try {
        const dados = await buscarProdutosDestaque(8);
        setProdutos(dados);
      } catch (erro) {
        console.error("Erro ao buscar produtos:", erro);
        setErro(true);
      } finally {
        setCarregando(false);
      }
    }

    carregarProdutos();
  }, []);


  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundImage: TEXTURA_PAPEL_SVG, backgroundBlendMode: "multiply" }}
    >
      <VisitantHeader />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-8">
        <HeroBanner />
        <SecaoDeCards
          title={"Obras em Destaque"}
          subtitle={"Peças autênticas e produzidas à mão no agreste e zona da mata."}
          linkHref="/acervo"
          linkText="Ver todo o acervo">

          <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {carregando ? (
              <p>Carregando produtos...</p>
            ) : erro ? (
              <p>Não foi possível carregar os produtos. Tente novamente mais tarde.</p>
            ) : produtos.length > 0 ? (
              produtos.map((produto) => (
                <ProductCard
                  key={produto.id}
                  id={produto.id}
                  nome={produto.nome}
                  artesao={produto.artesao}
                  preco={produto.preco.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                  imagem={produto.imagem}
                />
              ))
            ) : (
              <p>Nenhum produto encontrado.</p>
            )}

          </div>
        </SecaoDeCards>
      </main>
      <Footer />
    </div>
  );
}
