import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { VisitantHeader } from "@/components/layout/header";
import ProductPage from "@/components/product/product-page";

export default function ProductMarketplace({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div>
        <VisitantHeader/>
        <Suspense
          fallback={
            <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
              <p role="status">Carregando produto...</p>
            </main>
          }
        >
          <ProductRoute params={params} />
        </Suspense>
        <Footer/>
    </div>
  );
}

async function ProductRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductPage id={id} />;
}