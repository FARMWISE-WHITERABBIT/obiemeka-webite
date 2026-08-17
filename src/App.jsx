import React, { useState, useEffect } from 'react'
import { Nav, Hero, StatsBar, About, Ventures, Press, Expertise, Speaking, Packages, Social, Footer } from './sections'
import { BookingForm } from './BookingForm'
import { TweaksPanel, TweakSection, TweakRadio, useTweaks } from './TweaksPanel'

const TWEAK_DEFAULTS = {
  accent: 'green',
}

// Speaking-topic headings -> the matching option in BookingForm's TOPICS list
const SPEAKING_TOPIC_MAP = {
  'Export compliance & EUDR readiness': 'Speaking — Export compliance & EUDR',
  'African agri-tech & investment': 'Speaking — African agri-tech & investment',
  'Smallholder digitization': 'Speaking — Smallholder digitization',
  'Agro real estate as an asset class': 'Speaking — Agro real estate',
}

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS)
  const [pickedSession, setPickedSession] = useState(null)
  const [pickedTopic, setPickedTopic] = useState(null)
  const [onPaper, setOnPaper] = useState(false)

  useEffect(() => {
    document.body.classList.remove('accent-citrus', 'accent-rust', 'accent-aqua', 'accent-green')
    document.body.classList.add('accent-' + t.accent)
  }, [t.accent])

  useEffect(() => {
    function check() {
      const navH = 80
      const el = document.elementFromPoint(window.innerWidth / 2, navH + 4)
      if (!el) return
      const section = el.closest('section, footer, header, .hero, .ventures-section, .packages-section, .stats-bar, .press')
      if (!section) { setOnPaper(true); return }
      const bg = getComputedStyle(section).backgroundColor
      const m = bg.match(/rgba?\(([^)]+)\)/)
      if (!m) { setOnPaper(true); return }
      const parts = m[1].split(',').map((x) => parseFloat(x))
      const [r, g, b, a = 1] = parts
      // Sections with no background (e.g. .section) report transparent — the
      // page body itself is light, so treat "no color info" as light, not black.
      if (a === 0) { setOnPaper(true); return }
      const lum = 0.299 * r + 0.587 * g + 0.114 * b
      setOnPaper(lum > 140)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  function handleNav(id) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handlePackagePick(id) {
    setPickedSession(id)
    setTimeout(() => {
      document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function handleBookSpeaking(heading) {
    setPickedSession('speaking')
    if (heading && SPEAKING_TOPIC_MAP[heading]) {
      setPickedTopic(SPEAKING_TOPIC_MAP[heading])
    }
    setTimeout(() => {
      document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  return (
    <>
      <Nav onNav={handleNav} onPaperSection={onPaper} />
      <Hero onNav={handleNav} />
      <StatsBar />
      <About />
      <Press />
      <Ventures />
      <Expertise />
      <Speaking onBookSpeaking={handleBookSpeaking} />
      <Packages onPick={handlePackagePick} />

      <section className="section" id="book">
        <div className="section-head">
          <div>
            <span className="lab">— 06 · Book a consultation</span>
            <h2>
              What's the<br />
              <em>problem</em>?
            </h2>
          </div>
          <p className="lede">
            Every brief goes to a real person — me. The more specific you
            can be about what's going wrong, and what you want to happen
            next, the faster we'll both know if I can help. If I can't,
            I'll say so and try to point you somewhere useful.
          </p>
        </div>

        <div className="booking">
          <div className="booking-side">
            <div className="num-card">
              <div className="nc-head">
                <span>— Booking · 06</span>
                <span>OE / 2026</span>
              </div>
              <h3>You're talking directly to me.</h3>
              <p>
                Briefs come straight to my inbox, and I read every one
                myself. There's no sales team and no qualification
                process — I just check whether it fits what's already on
                my calendar over the next couple of weeks.
              </p>
              <div className="when">
                <span className="chip">Mon–Thu</span>
                <span className="chip">09:00–17:00 WAT</span>
                <span className="chip">Reply ≤ 48h</span>
              </div>
            </div>
          </div>
          <BookingForm pickedSession={pickedSession} onPickSession={setPickedSession} pickedTopic={pickedTopic} />
        </div>
      </section>

      <Social />
      <Footer onNav={handleNav} />

      {import.meta.env.DEV && (
        <TweaksPanel title="Tweaks">
          <TweakSection label="Accent" subtitle="The one note in the system">
            <TweakRadio
              label="Accent color"
              value={t.accent}
              onChange={(v) => setTweak('accent', v)}
              options={[
                { value: 'green',  label: 'Green'  },
                { value: 'aqua',   label: 'Aqua'   },
                { value: 'citrus', label: 'Citrus' },
                { value: 'rust',   label: 'Rust'   },
              ]}
            />
          </TweakSection>
        </TweaksPanel>
      )}
    </>
  )
}
