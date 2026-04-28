import Hero from "../components/Hero.jsx";
import CategoryGrid from "../components/CategoryGrid.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import WhyAimForge from "../components/WhyAimForge.jsx";
import BrandShowcase from "../components/BrandShowcase.jsx";
import CTABanner from "../components/CTABanner.jsx";

export default function Home() {
  return (
    <main>
      <Hero />
      <CategoryGrid />
      <ProductGrid />
      <WhyAimForge />
      <BrandShowcase />
      <CTABanner />
    </main>
  );
}
