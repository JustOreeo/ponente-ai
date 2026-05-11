// Top-level app — wires every card into the DesignCanvas, with a Tweaks
// panel for live name/palette/serif/density swapping.

const TWEAK_DEFAULTS = window.PONENTE_DEFAULTS;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const theme = window.resolveTheme(t);

  return (
    <>
      <DesignCanvas>
        <DCSection id="brand" title="01 · Brand foundation" subtitle="Naming rationale, color, type, voice. Every card live-updates with the tweaks panel.">
          <DCArtboard id="rationale" label="Why Ponente" width={920} height={620}>
            <BrandRationale theme={theme} />
          </DCArtboard>
          <DCArtboard id="palette" label="Color system" width={760} height={620}>
            <PaletteCard theme={theme} />
          </DCArtboard>
          <DCArtboard id="type" label="Type system" width={760} height={620}>
            <TypeCard theme={theme} />
          </DCArtboard>
          <DCArtboard id="voice" label="Voice · do & don't" width={760} height={620}>
            <VoiceCard theme={theme} />
          </DCArtboard>
        </DCSection>

        <DCSection id="logo" title="02 · Logo concepts" subtitle="Three directions for the mark. Wordmark, mono variants, favicon — all use the current tweaked palette + serif.">
          <DCArtboard id="logoA" label="A · The Signature" width={680} height={520}>
            <LogoCard theme={theme} concept={LOGO_CONCEPTS[0]} />
          </DCArtboard>
          <DCArtboard id="logoB" label="B · The Codal Column" width={680} height={520}>
            <LogoCard theme={theme} concept={LOGO_CONCEPTS[1]} />
          </DCArtboard>
          <DCArtboard id="logoC" label="C · The Apostille" width={680} height={520}>
            <LogoCard theme={theme} concept={LOGO_CONCEPTS[2]} />
          </DCArtboard>
        </DCSection>

        <DCSection id="kit" title="03 · Component kit" subtitle="The primitives — citation pill is the special one.">
          <DCArtboard id="components" label="UI primitives" width={1100} height={680}>
            <ComponentsCard theme={theme} />
          </DCArtboard>
        </DCSection>

        <DCSection id="home" title="04 · Homepage" subtitle="Standard SaaS density. Hero · trust · features · drafting wedge · pricing · founder note · footer.">
          <DCArtboard id="homepage" label="Marketing home" width={1280} height={2700}>
            <HomepageCard theme={theme} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Brand tweaks">
        <TweakSection label="Identity" />
        <TweakRadio label="Name" value={t.name}
          options={[
            { value: 'ponente', label: 'Ponente' },
            { value: 'batas', label: 'Batas' },
            { value: 'codigo', label: 'Codigo' },
          ]}
          onChange={(v) => setTweak('name', v)} />

        <TweakSection label="Palette" />
        <TweakSelect label="Direction" value={t.palette}
          options={[
            { value: 'library', label: 'Library — parchment + navy + oxblood' },
            { value: 'navy', label: 'Court — navy-dominant' },
            { value: 'ivory', label: 'Ivory — austere' },
            { value: 'bloomberg', label: 'Terminal — near-black + gold' },
          ]}
          onChange={(v) => setTweak('palette', v)} />

        <TweakSection label="Typography" />
        <TweakSelect label="Headline serif" value={t.serif}
          options={[
            { value: 'source', label: 'Source Serif 4' },
            { value: 'newsreader', label: 'Newsreader' },
            { value: 'fraunces', label: 'Fraunces' },
            { value: 'garamond', label: 'EB Garamond' },
          ]}
          onChange={(v) => setTweak('serif', v)} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
