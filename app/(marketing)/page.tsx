import { Hero } from "./_home/hero";
import { TrustStrip } from "./_home/trust-strip";
import { FeatureGrid } from "./_home/feature-grid";
import { DraftingDemo } from "./_home/drafting-demo";
import { PricingTeaser } from "./_home/pricing-teaser";
import { FounderNote } from "./_home/founder-note";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <FeatureGrid />
      <DraftingDemo />
      <PricingTeaser />
      <FounderNote />
    </>
  );
}
