"use client";

import { VisitantHeader } from "@/components/ui/header";

// Textura de grão de papel para o fundo creme, subliminar (acabamento xilogravura)
const TEXTURA_PAPEL_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;


export default function HomeMarketplace() {
  return (
    <div
      className="flex min-h-screen flex-col bg-creme font-sans"
      style={{ backgroundImage: TEXTURA_PAPEL_SVG, backgroundBlendMode: "multiply" }}
    >
      <VisitantHeader/>
    </div>
  );
}
