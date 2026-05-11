import { PricingGrid } from "@/components/marketing/pricing-grid";

export function PricingTeaser() {
  return (
    <section className="px-6 pb-12 sm:px-10 sm:pb-16 lg:px-14 lg:pb-[88px]">
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-6 md:mb-8 gap-2 md:gap-8">
        <h2
          className="font-serif text-[28px] sm:text-[32px] lg:text-[36px] font-normal m-0"
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
