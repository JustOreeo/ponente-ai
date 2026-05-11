// Component primitives — citation pill (the special one), buttons, inputs,
// badges, code blocks, table. Shown as one big card.

function ComponentsCard({ theme }) {
  const p = theme.palette;
  const serif = theme.serif.stack;

  return (
    <div style={{ width: '100%', height: '100%', background: p.bg, color: p.ink, padding: '40px 48px', display: 'flex', flexDirection: 'column', fontFamily: 'Inter', overflow: 'hidden' }}>
      <CardEyebrow p={p}>Components · primitives</CardEyebrow>
      <div style={{ fontFamily: serif, fontSize: 36, fontWeight: 400, letterSpacing: '-0.015em', marginBottom: 24 }}>
        The kit.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, flex: 1, minHeight: 0 }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Section title="Buttons" p={p}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <BtnPrimary p={p}>Draft a pleading</BtnPrimary>
              <BtnSecondary p={p}>Ask a question</BtnSecondary>
              <BtnGhost p={p}>Cancel</BtnGhost>
              <BtnPrimary p={p} small>Export .docx</BtnPrimary>
            </div>
          </Section>

          <Section title="Inputs" p={p}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input p={p} label="Case caption" value="People v. Dela Cruz" />
              <Input p={p} label="Practice area" value="Criminal · NLRC" select />
            </div>
          </Section>

          <Section title="Badges" p={p}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge bg={p.surfaceAlt} fg={p.ink}>Verified</Badge>
              <Badge bg={p.accent} fg={p.bg}>Pro</Badge>
              <Badge bg="transparent" fg={p.muted} border={p.line}>Draft</Badge>
              <Badge bg="#3F6B4E" fg="#FAF7EE">4 sources</Badge>
              <Badge bg="transparent" fg="#A8332A" border="#A8332A">Unverified</Badge>
            </div>
          </Section>

          <Section title="Disclaimer line" p={p}>
            <div style={{ fontSize: 12.5, color: p.muted, fontStyle: 'italic', borderLeft: `2px solid ${p.line}`, paddingLeft: 12, lineHeight: 1.5 }}>
              Verify with the source decision before relying on this in pleadings.
            </div>
          </Section>
        </div>

        {/* RIGHT — citation pill is the hero of this card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, minHeight: 0 }}>
          <Section title="Citation pill · special component" p={p}>
            <div style={{ background: p.surface, border: `1px solid ${p.line}`, padding: '16px 18px', fontFamily: serif, fontSize: 15.5, lineHeight: 1.6, color: p.ink }}>
              The Court has consistently held that procedural rules may be relaxed in the interest of substantial justice
              <CitationPill p={p}>G.R. No. 247429</CitationPill>
              <span style={{ fontStyle: 'italic' }}> Heirs of Malate v. Gamboa</span>
              <span> (2020), and that the doctrine extends to labor disputes</span>
              <CitationPill p={p}>R.A. No. 11058</CitationPill>
              <span>.</span>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 11.5, color: p.muted, lineHeight: 1.5 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: p.ink, fontSize: 12, marginBottom: 4 }}>Click → side panel</div>
                Opens the source PDF, syllabus, ponente, division.
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: p.ink, fontSize: 12, marginBottom: 4 }}>Hover → tooltip</div>
                Decision date, ponente justice, citator status.
              </div>
            </div>
          </Section>

          <Section title="Code / clause block" p={p}>
            <div style={{ background: p.ink, color: p.bg, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11.5, padding: '12px 14px', lineHeight: 1.55, borderRadius: 0 }}>
              <span style={{ color: p.gold }}>SEC. 4.</span> <span>Coverage. — This Act shall apply to all places of</span><br/>
              <span>employment, including those located in the Philippine</span><br/>
              <span>Economic Zones, with respect to occupational safety</span><br/>
              <span>and health.</span>
            </div>
          </Section>

          <Section title="Table" p={p}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${p.ink}` }}>
                  <Th p={p}>Doc</Th><Th p={p}>Type</Th><Th p={p}>Citations</Th><Th p={p} right>Updated</Th>
                </tr>
              </thead>
              <tbody>
                <Tr p={p} cells={['Demand to Globe Telecom', 'Demand', '3', 'Today']} />
                <Tr p={p} cells={['Affidavit of Loss · driver\'s license', 'Affidavit', '1', 'Yesterday']} />
                <Tr p={p} cells={['NLRC Position Paper · Reyes v. ACME', 'Position Paper', '7', '2 days ago']} />
              </tbody>
            </table>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, p, children }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: p.muted, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function BtnPrimary({ p, children, small }) {
  return <button style={{ background: p.ink, color: p.bg, border: 'none', padding: small ? '7px 14px' : '11px 18px', fontFamily: 'Inter', fontSize: small ? 12.5 : 13.5, fontWeight: 500, letterSpacing: '0.005em', cursor: 'pointer', borderRadius: 2 }}>{children}</button>;
}
function BtnSecondary({ p, children }) {
  return <button style={{ background: 'transparent', color: p.ink, border: `1px solid ${p.ink}`, padding: '10px 17px', fontFamily: 'Inter', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', borderRadius: 2 }}>{children}</button>;
}
function BtnGhost({ p, children }) {
  return <button style={{ background: 'transparent', color: p.muted, border: 'none', padding: '10px 12px', fontFamily: 'Inter', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>{children}</button>;
}

function Input({ p, label, value, select }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: p.muted }}>{label}</span>
      <div style={{ background: p.surface, border: `1px solid ${p.line}`, padding: '10px 12px', fontFamily: 'Inter', fontSize: 13.5, color: p.ink, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 2 }}>
        <span>{value}</span>
        {select && <svg width="10" height="6" viewBox="0 0 10 6"><path d="M0 0L5 6L10 0" fill={p.muted}/></svg>}
      </div>
    </div>
  );
}

function Badge({ bg, fg, border, children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', background: bg, color: fg, border: border ? `1px solid ${border}` : 'none', padding: '4px 10px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10.5, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 999 }}>{children}</span>;
}

function CitationPill({ p, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: p.surfaceAlt, color: p.ink, border: `1px solid ${p.line}`, padding: '1px 8px 2px', margin: '0 3px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11.5, fontWeight: 500, fontStyle: 'normal', borderRadius: 2, verticalAlign: 'baseline', cursor: 'pointer', position: 'relative' }}>
      <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: p.accent }}/>
      {children}
    </span>
  );
}

function Th({ p, children, right }) {
  return <th style={{ textAlign: right ? 'right' : 'left', padding: '8px 6px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: p.muted }}>{children}</th>;
}
function Tr({ p, cells }) {
  return (
    <tr style={{ borderBottom: `1px solid ${p.lineSoft}` }}>
      {cells.map((c, i) => (
        <td key={i} style={{ padding: '10px 6px', fontFamily: i === 0 ? '"Source Serif 4", serif' : 'Inter', fontSize: i === 0 ? 13.5 : 12, color: i === cells.length - 1 ? p.muted : p.ink, textAlign: i === cells.length - 1 ? 'right' : 'left', fontVariantNumeric: 'tabular-nums' }}>{c}</td>
      ))}
    </tr>
  );
}

Object.assign(window, { ComponentsCard, CitationPill, BtnPrimary, BtnSecondary, BtnGhost });
