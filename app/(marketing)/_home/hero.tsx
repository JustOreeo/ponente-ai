import { BtnPrimary, BtnGhost } from "@/components/buttons";
import { DraftingPreview } from "./drafting-preview";

export function Hero() {
  return (
    <section className="px-6 pt-12 pb-10 sm:px-10 sm:pt-16 sm:pb-12 lg:px-14 lg:pt-[88px] lg:pb-[72px]">
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] items-center gap-10 lg:gap-14">
        <div>
          <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted mb-5">
            <span className="text-accent">●</span>
            &nbsp;&nbsp;Built in Manila for Philippine practice
          </div>
          <h1
            className="font-serif text-[40px] sm:text-[52px] lg:text-[68px] font-normal m-0"
            style={{
              lineHeight: 1.02,
              letterSpacing: "-0.025em",
            }}
          >
            The legal AI that{" "}
            <em className="italic text-accent">drafts,</em>
            <br />
            not just answers.
          </h1>
          <p
            className="text-[16px] sm:text-[17.5px] text-ink-soft my-6 mb-8 max-w-[520px]"
            style={{ lineHeight: 1.55, textWrap: "pretty" }}
          >
            Ponente writes pleadings, affidavits, and position papers from your
            inputs — and cites every Philippine case, R.A., and constitutional
            provision behind each line.
          </p>
          <div className="flex flex-wrap gap-3 items-center mb-7">
            <BtnPrimary>Draft your first pleading →</BtnPrimary>
            <BtnGhost>Watch a 90-sec demo</BtnGhost>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-muted font-mono tracking-[0.04em] uppercase">
            <span>5 free questions / day</span>
            <span className="opacity-50">·</span>
            <span>No card required</span>
            <span className="opacity-50">·</span>
            <span>Pro from ₱1,499/mo</span>
          </div>
        </div>

        <DraftingPreview />
      </div>
    </section>
  );
}
