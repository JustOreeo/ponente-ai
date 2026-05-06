import { PricingGrid } from "@/components/marketing/pricing-grid";

export function PricingTeaser() {
  return (
    <section style={{ padding: "0 56px 88px" }}>
      <div className="flex items-baseline justify-between mb-8">
        <h2
          className="font-serif text-[36px] font-normal m-0"
          style={{ letterSpacing: "-0.015em" }}
        >
          Pricing for solo and small firms.
        </h2>
        <span className="text-[13px] text-muted">
          All prices in PHP · Paymongo: cards, GCash, Maya
        </span>
      </div>
      <PricingGrid />
    </section>
  );
}
