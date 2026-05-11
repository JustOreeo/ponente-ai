// Homepage anchor — full marketing layout at standard SaaS density.
// Hero, trust strip, 3-feature grid, drafting demo strip, comparison
// (medium drafting emphasis, no naming competitors), pricing teaser,
// founder note, footer.

function HomepageCard({ theme }) {
  const p = theme.palette;
  const serif = theme.serif.stack;
  const nm = theme.name.word;

  return (
    <div style={{ width: '100%', height: '100%', background: p.bg, color: p.ink, fontFamily: 'Inter', overflow: 'auto' }}>
      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 56px', borderBottom: `1px solid ${p.lineSoft}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LogoMarkColumn size={28} color={p.ink} accent={p.accent} />
          <span style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, letterSpacing: '-0.018em' }}>{nm}</span>
        </div>
        <div style={{ display: 'flex', gap: 28, fontSize: 13.5, color: p.inkSoft }}>
          <span>Drafting</span><span>Q&amp;A</span><span>Citations</span><span>Pricing</span><span>For firms</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13.5, color: p.inkSoft }}>Sign in</span>
          <BtnPrimary p={p} small>Start free</BtnPrimary>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '88px 56px 72px', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 56, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: p.muted, marginBottom: 20 }}>
            <span style={{ color: p.accent }}>●</span>&nbsp;&nbsp;Built in Manila for Philippine practice
          </div>
          <h1 style={{ fontFamily: serif, fontSize: 68, fontWeight: 400, lineHeight: 1.02, letterSpacing: '-0.025em', margin: 0 }}>
            The legal AI that <em style={{ fontStyle: 'italic', color: p.accent }}>drafts,</em><br/>
            not just answers.
          </h1>
          <p style={{ fontSize: 17.5, color: p.inkSoft, lineHeight: 1.55, margin: '24px 0 32px', maxWidth: 520, textWrap: 'pretty' }}>
            {nm} writes pleadings, affidavits, and position papers from your inputs — and cites every Philippine case, R.A., and constitutional provision behind each line.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 28 }}>
            <BtnPrimary p={p}>Draft your first pleading →</BtnPrimary>
            <BtnGhost p={p}>Watch a 90-sec demo</BtnGhost>
          </div>
          <div style={{ display: 'flex', gap: 22, fontSize: 12, color: p.muted, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            <span>5 free questions / day</span><span style={{ opacity: 0.5 }}>·</span><span>No card required</span><span style={{ opacity: 0.5 }}>·</span><span>Pro from ₱1,499/mo</span>
          </div>
        </div>

        {/* hero artifact — drafting preview */}
        <DraftingPreview theme={theme} />
      </section>

      {/* TRUST STRIP */}
      <section style={{ padding: '20px 56px 36px', borderTop: `1px solid ${p.lineSoft}`, borderBottom: `1px solid ${p.lineSoft}`, background: p.surface }}>
        <div style={{ fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: p.muted, marginBottom: 16, fontFamily: 'IBM Plex Mono, monospace' }}>Used by lawyers at</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          <Quote p={p} serif={serif} who="Atty. Maria Reyes" where="Solo · Quezon City" line="It drafted a position paper in eight minutes that I would have spent the afternoon on. Every citation checked out." />
          <Quote p={p} serif={serif} who="Atty. Joaquin Cruz" where="Cruz &amp; Partners · Makati" line="The drafting is the difference. I&apos;ve tried the Q&amp;A tools — they save research, not work." />
          <Quote p={p} serif={serif} who="Atty. Lia Santos" where="In-house · BGC" line="The citation panel is the part I trust. Click any case, see the actual decision." />
        </div>
      </section>

      {/* FEATURE GRID */}
      <section style={{ padding: '88px 56px 72px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 40 }}>
          <h2 style={{ fontFamily: serif, fontSize: 44, fontWeight: 400, letterSpacing: '-0.018em', margin: 0, maxWidth: 520, lineHeight: 1.05 }}>
            Three things, done well.
          </h2>
          <div style={{ fontSize: 13.5, color: p.muted, maxWidth: 320, lineHeight: 1.5 }}>
            Every output is grounded in Philippine sources — Supreme Court decisions, Republic Acts, the 1987 Constitution.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: `1px solid ${p.line}`, borderBottom: `1px solid ${p.line}` }}>
          <Feature p={p} serif={serif} num="01" tag="Drafting" head="Pleadings, ready in minutes." body="Demand letters, affidavits of loss, NLRC position papers, motions for reconsideration, verified petitions. Five templates at launch — more in the queue." />
          <Feature p={p} serif={serif} num="02" tag="Q&A" head="Answers with receipts." body="Every answer ships with the cases that support it. Click a citation to read the source decision in a side panel." border />
          <Feature p={p} serif={serif} num="03" tag="Citations" head="Real ones. Counted." body="No hallucinated G.R. numbers. Each output shows verified vs. unverified — and explains why a source did or didn&apos;t make it in." border />
        </div>
      </section>

      {/* DRAFTING DEMO STRIP */}
      <section style={{ padding: '0 56px 88px' }}>
        <div style={{ background: p.ink, color: p.bg, padding: '64px 56px', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 56, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: p.gold, marginBottom: 18 }}>The wedge</div>
            <h2 style={{ fontFamily: serif, fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.018em', margin: '0 0 18px', color: p.bg }}>
              Other tools answer.<br/>
              <em style={{ fontStyle: 'italic', color: p.gold }}>{nm} writes the document you file.</em>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(245,239,226,0.78)', lineHeight: 1.55, margin: '0 0 28px', maxWidth: 480 }}>
              Q&amp;A is the easy half. Drafting — turning facts into a verified, properly-cited pleading — is what lawyers actually deliver to clients. Five templates. Every line traceable.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 13.5, color: 'rgba(245,239,226,0.85)' }}>
              {['Demand Letter', 'Affidavit of Loss', 'NLRC Position Paper', 'Motion for Reconsideration', 'Verified Petition', 'More this quarter'].map((t, i) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: i > 1 ? '1px solid rgba(245,239,226,0.1)' : 'none' }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: i === 5 ? p.muted : p.gold }}/>
                  <span style={{ opacity: i === 5 ? 0.6 : 1 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Comparison panel */}
          <div style={{ background: p.surfaceAlt, color: p.ink, padding: 0, border: `1px solid ${p.gold}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${p.line}` }}>
              <div style={{ padding: '14px 18px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'IBM Plex Mono, monospace', color: p.muted, borderRight: `1px solid ${p.line}` }}>Other PH legal AI</div>
              <div style={{ padding: '14px 18px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'IBM Plex Mono, monospace', color: p.accent, fontWeight: 600 }}>{nm}</div>
            </div>
            {[
              ['Q&A with citations', true, true],
              ['Verified PH-only sources', '~', true],
              ['Drafts demand letters', false, true],
              ['Drafts NLRC position papers', false, true],
              ['Export to .docx, edit-ready', false, true],
              ['Citation pill → source PDF', false, true],
            ].map(([label, a, b], i) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: i < 5 ? `1px solid ${p.lineSoft}` : 'none' }}>
                <div style={{ padding: '12px 18px', fontSize: 13.5, color: p.inkSoft, borderRight: `1px solid ${p.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{label}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 14, color: a === true ? '#3F6B4E' : a === false ? p.muted : p.muted }}>{a === true ? '✓' : a === false ? '—' : '~'}</span>
                </div>
                <div style={{ padding: '12px 18px', fontSize: 13.5, color: p.ink, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{label}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 14, color: b ? '#3F6B4E' : p.muted }}>{b ? '✓' : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section style={{ padding: '0 56px 88px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 32 }}>
          <h2 style={{ fontFamily: serif, fontSize: 36, fontWeight: 400, letterSpacing: '-0.015em', margin: 0 }}>Pricing for solo and small firms.</h2>
          <span style={{ fontSize: 13, color: p.muted }}>All prices in PHP · Paymongo: cards, GCash, Maya</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: `1px solid ${p.line}` }}>
          <Tier p={p} serif={serif} name="Free" price="₱0" sub="forever" feats={['5 questions / day', 'Q&A only', '1 user']} />
          <Tier p={p} serif={serif} name="Pro" price="₱1,499" sub="/month" feats={['Unlimited Q&A', 'All 5 drafting templates', 'Citation panel + .docx export']} highlight />
          <Tier p={p} serif={serif} name="Small Firm" price="₱1,199" sub="/seat/mo · annual" feats={['Everything in Pro', 'Team library + sharing', 'Admin & SSO']} />
        </div>
      </section>

      {/* FOUNDER NOTE */}
      <section style={{ padding: '0 56px 88px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.4fr', gap: 56, alignItems: 'flex-start', borderTop: `1px solid ${p.line}`, paddingTop: 56 }}>
          <div>
            <div style={{ width: 64, height: 64, background: p.surfaceAlt, border: `1px solid ${p.line}`, borderRadius: '50%', marginBottom: 14 }}/>
            <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 500 }}>A note from the team.</div>
            <div style={{ fontSize: 12, color: p.muted, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.04em', marginTop: 4 }}>Manila · 2026</div>
          </div>
          <div style={{ fontFamily: serif, fontSize: 19, lineHeight: 1.55, color: p.inkSoft, textWrap: 'pretty' }}>
            We've spent the last three years running a legal AI in Luxembourg. We learned the hard part isn't answering — it's drafting something a lawyer would actually file. {nm} is what we'd build if we started over, for the practice we know best.
            <span style={{ display: 'block', marginTop: 18, fontFamily: 'Inter', fontSize: 13.5, color: p.muted }}>— The {nm} team</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: p.ink, color: p.bg, padding: '48px 56px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
          <PonenteWordmark size={64} color={p.bg} serif={serif} name={nm} />
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: p.gold }}>Manila · Philippines</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, fontSize: 13, color: 'rgba(245,239,226,0.75)', borderTop: `1px solid rgba(245,239,226,0.15)`, paddingTop: 28 }}>
          <FootCol head="Product" items={['Drafting', 'Q&A', 'Citations', 'Pricing']} />
          <FootCol head="For firms" items={['Small Firm plan', 'SSO &amp; admin', 'Onboarding']} />
          <FootCol head="Resources" items={['Templates', 'Citation guide', 'Changelog']} />
          <FootCol head="Company" items={['About', 'Privacy', 'Terms', 'Contact']} />
        </div>
        <div style={{ marginTop: 36, fontSize: 11, color: 'rgba(245,239,226,0.55)', fontStyle: 'italic', maxWidth: 720 }}>
          {nm} is a drafting and research aid. It is not a substitute for a licensed attorney. Verify every cited source before relying on output in pleadings or filings.
        </div>
      </footer>
    </div>
  );
}

function Quote({ p, serif, who, where, line }) {
  return (
    <div>
      <div style={{ fontFamily: serif, fontSize: 16, fontStyle: 'italic', color: p.ink, lineHeight: 1.45, marginBottom: 12, textWrap: 'pretty' }} dangerouslySetInnerHTML={{ __html: '\u201C' + line + '\u201D' }} />
      <div style={{ fontSize: 12, color: p.ink, fontWeight: 600 }}>{who}</div>
      <div style={{ fontSize: 11.5, color: p.muted }} dangerouslySetInnerHTML={{ __html: where }}/>
    </div>
  );
}

function Feature({ p, serif, num, tag, head, body, border }) {
  return (
    <div style={{ padding: '32px 28px', borderLeft: border ? `1px solid ${p.line}` : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10.5, color: p.accent, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{num} · {tag}</span>
      </div>
      <h3 style={{ fontFamily: serif, fontSize: 26, fontWeight: 500, letterSpacing: '-0.012em', margin: '0 0 12px', lineHeight: 1.15 }}>{head}</h3>
      <p style={{ fontSize: 14.5, color: p.inkSoft, lineHeight: 1.55, margin: 0, textWrap: 'pretty' }}>{body}</p>
    </div>
  );
}

function Tier({ p, serif, name, price, sub, feats, highlight }) {
  return (
    <div style={{ padding: '32px 28px', borderRight: `1px solid ${p.line}`, background: highlight ? p.surface : 'transparent', position: 'relative' }}>
      {highlight && <div style={{ position: 'absolute', top: 16, right: 16, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: p.accent }}>Most picked</div>}
      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: p.muted, marginBottom: 12 }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 18 }}>
        <span style={{ fontFamily: serif, fontSize: 40, fontWeight: 500, letterSpacing: '-0.02em' }}>{price}</span>
        <span style={{ fontSize: 13, color: p.muted }}>{sub}</span>
      </div>
      <div style={{ borderTop: `1px solid ${p.lineSoft}`, paddingTop: 14 }}>
        {feats.map((f) => (
          <div key={f} style={{ fontSize: 13.5, color: p.inkSoft, padding: '5px 0', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: p.accent, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>·</span>
            <span>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FootCol({ head, items }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A961', marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: head }}/>
      {items.map((it) => <div key={it} style={{ padding: '4px 0' }} dangerouslySetInnerHTML={{ __html: it }}/>)}
    </div>
  );
}

// Hero artifact — a drafting preview window with citations.
function DraftingPreview({ theme }) {
  const p = theme.palette;
  const serif = theme.serif.stack;
  return (
    <div style={{ background: p.surface, border: `1px solid ${p.line}`, boxShadow: `0 24px 60px ${p.ink}14, 0 1px 0 #fff inset`, position: 'relative' }}>
      {/* doc header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${p.line}`, background: p.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: p.muted, letterSpacing: '0.06em' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.accent }}/>
          DEMAND LETTER · v3 · drafting
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, padding: '3px 8px', background: '#3F6B4E', color: p.bg, letterSpacing: '0.08em' }}>3 SOURCES</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.55fr', minHeight: 380 }}>
        {/* doc body */}
        <div style={{ padding: '28px 32px', borderRight: `1px solid ${p.line}`, fontFamily: serif, fontSize: 14, lineHeight: 1.65, color: p.ink }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: p.muted, marginBottom: 8, fontFamily: 'Inter' }}>Re: Demand for Payment</div>
          <p style={{ margin: '0 0 10px' }}><strong>Dear Mr. Tan,</strong></p>
          <p style={{ margin: '0 0 10px' }}>This is a formal demand for the immediate payment of <strong>₱847,500.00</strong> representing unpaid services rendered under our Service Agreement dated 14 March 2024.</p>
          <p style={{ margin: '0 0 10px' }}>Under <span style={{ background: p.surfaceAlt, padding: '0 6px', border: `1px solid ${p.line}`, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11.5 }}>Art. 1169, Civil Code</span>, your obligation became demandable upon the lapse of the agreed period. Continued non-payment constitutes mora solvendi.</p>
          <p style={{ margin: '0 0 10px', opacity: 0.5 }}>Failure to remit within fifteen (15) calendar days from receipt hereof shall compel us to pursue all available legal remedies, including the filing of…</p>
        </div>
        {/* citations panel */}
        <div style={{ padding: '20px 18px', background: p.bg }}>
          <div style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: p.muted, marginBottom: 12, fontFamily: 'IBM Plex Mono, monospace' }}>Citations</div>
          {[
            { tag: 'Art. 1169', name: 'Civil Code of the Philippines', meta: 'Republic Act · verified' },
            { tag: 'G.R. No. 196444', name: 'Solid Homes v. Spouses Tan', meta: '2014 · 2nd Division' },
            { tag: 'G.R. No. 175852', name: 'Spouses Reyes v. BPI', meta: '2010 · En Banc' },
          ].map((c) => (
            <div key={c.tag} style={{ borderTop: `1px solid ${p.lineSoft}`, padding: '12px 0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: p.surfaceAlt, border: `1px solid ${p.line}`, padding: '1px 8px 2px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10.5, color: p.ink, marginBottom: 6 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: p.accent }}/>{c.tag}
              </div>
              <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 12.5, color: p.ink, lineHeight: 1.4 }}>{c.name}</div>
              <div style={{ fontSize: 10.5, color: p.muted, fontFamily: 'IBM Plex Mono, monospace', marginTop: 2 }}>{c.meta}</div>
            </div>
          ))}
        </div>
      </div>

      {/* doc footer */}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${p.line}`, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
        <span style={{ color: p.muted, fontStyle: 'italic' }}>Verify with the source decision before relying on this in pleadings.</span>
        <span style={{ background: p.ink, color: p.bg, padding: '5px 10px', fontFamily: 'Inter', fontSize: 11.5, fontWeight: 500 }}>Export .docx ↓</span>
      </div>
    </div>
  );
}

Object.assign(window, { HomepageCard });
