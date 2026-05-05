/* global React, ReactDOM, Nav, Hero, StatsBar, About, Ventures, Press, Expertise, Speaking, Packages, Social, Footer, BookingForm, TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakColor, TweakToggle */
const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "citrus",
  "stripeBorder": true,
  "heroStyle": "stacked",
  "showTicker": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [pickedSession, setPickedSession] = useState(null);
  const [onPaper, setOnPaper] = useState(false);

  // accent class on body
  useEffect(() => {
    document.body.classList.remove('accent-citrus', 'accent-rust', 'accent-aqua');
    document.body.classList.add('accent-' + t.accent);
  }, [t.accent]);

  // detect when nav is over a paper section vs ink section
  useEffect(() => {
    function check() {
      const navH = 80;
      // sample point just below nav
      const el = document.elementFromPoint(window.innerWidth / 2, navH + 4);
      if (!el) return;
      const section = el.closest('section, footer, header, .hero, .ventures-section, .packages-section, .stats-bar, .press');
      if (!section) {
        setOnPaper(true);
        return;
      }
      const bg = getComputedStyle(section).backgroundColor;
      // parse rgb
      const m = bg.match(/rgba?\(([^)]+)\)/);
      if (!m) { setOnPaper(true); return; }
      const [r, g, b] = m[1].split(',').map((x) => parseFloat(x));
      const lum = (0.299 * r + 0.587 * g + 0.114 * b);
      setOnPaper(lum > 140);
    }
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  function handleNav(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handlePackagePick(id) {
    setPickedSession(id);
    setTimeout(() => {
      document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  return (
    <>
      <Nav accent={t.accent} onNav={handleNav} onPaperSection={onPaper} />
      <Hero onNav={handleNav} />
      <StatsBar />
      <About />
      <Ventures />
      <Press />
      <Expertise />
      <Speaking onBookSpeaking={(topic) => {
        if (topic) {
          const match = `Speaking — ${topic.replace('& ', '& ')}`;
          // best effort: just scroll, user picks topic
        }
        setPickedSession('speaking');
        setTimeout(() => {
          document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }} />
      <Packages onPick={handlePackagePick} />

      {/* Booking */}
      <section className="section" id="book">
        <div className="section-head">
          <div>
            <span className="lab">— 06 · Book a consultation</span>
            <h2>
              Tell me<br />
              the <em>problem</em>.
            </h2>
          </div>
          <p className="lede">
            One brief, one human reading it on the other end. The more
            specific you are about what's actually going wrong — and what
            "fixed" looks like — the faster we can decide if I can help.
            <b> If I can't, I'll tell you that, too.</b>
          </p>
        </div>

        <div className="booking">
          <div className="booking-side">
            <div className="num-card">
              <div className="nc-head">
                <span>— Booking · 06</span>
                <span>OE / 2026</span>
              </div>
              <h3>Direct line, not a funnel.</h3>
              <p>
                Briefs go straight to my inbox. No discovery sales team,
                no qualification gate — just whether the work fits the
                next two weeks of calendar.
              </p>
              <div className="when">
                <span className="chip">Mon–Thu</span>
                <span className="chip">09:00–17:00 WAT</span>
                <span className="chip">Reply ≤ 48h</span>
              </div>
            </div>
            <div className="booking-aside-meta">
              <b>Where I'm based</b>
              Enugu, Nigeria · Lagos satellite<br />
              Will travel for retainer engagements<br />
              <br />
              <b>What you'll get back</b>
              A reply (yes / no / referral)<br />
              A calendar link if it's a fit<br />
              An invoice within 24h of confirm
            </div>
          </div>
          <BookingForm pickedSession={pickedSession} onPickSession={setPickedSession} />
        </div>
      </section>

      <Social />
      <Footer onNav={handleNav} />

      {/* Tweaks */}
      <TweaksPanel title="Tweaks">
        <TweakSection title="Accent" subtitle="The one note in the system">
          <TweakRadio
            label="Accent color"
            value={t.accent}
            onChange={(v) => setTweak('accent', v)}
            options={[
              { value: 'citrus', label: 'Citrus' },
              { value: 'rust',   label: 'Rust'   },
              { value: 'aqua',   label: 'Aqua'   }
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
