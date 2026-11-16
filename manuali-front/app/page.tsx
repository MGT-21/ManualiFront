"use client";
import { Footer } from "@/components/footer";
import { VisitantHeader } from "@/components/header";
import { HeroBanner } from "@/components/herobanner";
import { ProductCard } from "@/components/product-card";
import { SecaoDeCards } from "@/components/secao-de-cards";


// Textura de grão de papel para o fundo creme, subliminar (acabamento xilogravura)
const TEXTURA_PAPEL_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

const PRODUTOS = [
  {
    id: 1,
    nome: "Bonecos de Barro - Retirantes",
    artesao: "Ateliê Mestre Vitalino Filho",
    preco: "R$ 180,00",
    imagem: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 2,
    nome: "Caminho de Mesa Renascença",
    artesao: "Dona Maria de Minha (Poção)",
    preco: "R$ 420,00",
    imagem: "https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    nome: "Leão de Nice em Madeira",
    artesao: "Mestre Nice (Tracunhaém)",
    preco: "R$ 580,00",
    imagem: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 4,
    nome: "Vaso de Barro Esmaltado",
    artesao: "Ateliê Barro Forte",
    preco: "R$ 145,00",
    imagem: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 5,
    nome: "Bolsa de Ouricuri Tecida",
    artesao: "Artesãs de Petrolina",
    preco: "R$ 130,00",
    imagem: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 6,
    nome: "Luminária Rendada em Metal",
    artesao: "Artesanato Alagoinha",
    preco: "R$ 290,00",
    imagem: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 7,
    nome: "Luminária Rendada em Metal",
    artesao: "Artesanato Alagoinha",
    preco: "R$ 290,00",
    imagem: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 8,
    nome: "Luminária Rendada em Metal",
    artesao: "Artesanato Alagoinha",
    preco: "R$ 290,00",
    imagem: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
  },
];


export default function HomeMarketplace() {


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
            {PRODUTOS.map((produto) => (
              <ProductCard
                key={produto.id} // Obrigatório no React para listas
                id={produto.id}
                nome={produto.nome}
                artesao={produto.artesao}
                preco={produto.preco}
                imagem={produto.imagem}
              />
            ))}
          </div>
        </SecaoDeCards>
      </main>
      <Footer/>
    </div>
  );
}
