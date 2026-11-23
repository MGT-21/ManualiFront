"use client";

import { Footer } from "@/components/layout/footer";
import { VisitantHeader } from "@/components/layout/header";
import { HeroBanner } from "@/components/home/hero-banner";
import { ProductCard } from "@/components/product/product-card";
import { SecaoDeCards } from "@/components/home/product-list";

import { useEffect, useState } from "react";
import { buscarProdutosDestaque } from "@/services/productsService";

import type { Product } from "@/types/product"


export default function HomeMarketplace() {
  const [produtos, setProdutos] = useState<Product[]>([]);
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
    <div>
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
              produtos.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  description={product.description}
                  price={product.price}
                  image={product.image}
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
