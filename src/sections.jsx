import React, { useState, useEffect, useRef } from 'react'

/* =============================================================
   useReveal — IntersectionObserver-driven reveal hook
   ============================================================= */
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

/* =============================================================
   NAV
   ============================================================= */
export function Nav({ onNav, onPaperSection }) {
  const [solid, setSolid] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const items = [
    { id: 'about',    label: 'About' },
    { id: 'ventures', label: 'Ventures' },
    { id: 'expertise',label: 'Expertise' },
    { id: 'speaking', label: 'Speaking' },
    { id: 'packages', label: 'Packages' },
    { id: 'connect',  label: 'Connect' },
  ]

  function navTo(id) {
    setMobileOpen(false)
    onNav(id)
  }

  return (
    <>
      <header className={`nav ${solid ? 'solid' : ''} ${onPaperSection ? 'on-paper' : ''}`}
              style={{ zIndex: 50 }}>
        <div className="left">
          <img className="mono-mark" src="/assets/monogram.png" alt="Obi Emeka" />
        </div>
        <nav aria-label="Main navigation">
          <ul>
            {items.map((it) => (
              <li key={it.id}>
                <a href={`#${it.id}`} onClick={(e) => { e.preventDefault(); navTo(it.id) }}>
                  {it.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="right">
          <span className="nav-meta">EN ↗ Enugu, NG</span>
          <a href="#book" className="nav-cta"
             onClick={(e) => { e.preventDefault(); navTo('book') }}>
            Book a call →
          </a>
          <button className={`hamburger ${mobileOpen ? 'open' : ''}`}
                  aria-label="Toggle menu"
                  onClick={() => setMobileOpen((v) => !v)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <nav>
          <ul>
            {items.map((it) => (
              <li key={it.id}>
                <a href={`#${it.id}`} onClick={(e) => { e.preventDefault(); navTo(it.id) }}>
                  {it.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href="#book" className="btn btn-primary mob-cta"
           onClick={(e) => { e.preventDefault(); navTo('book') }}>
          Book a consultation <span className="arrow" />
        </a>
        <div className="mob-meta">
          oe@obiemeka.com<br />
          +234 (0) 810 344 6650<br />
          Enugu, Nigeria
        </div>
      </div>
    </>
  )
}

/* =============================================================
   HERO
   ============================================================= */
export function Hero({ onNav }) {
  return (
    <section className="hero">
      <div className="grain" />
      <div className="accent-ring" />
      <div className="accent-dot" />

      <div className="hero-name">
        <h1>
          Obi<br />
          Em<em>e</em>ka<span style={{ color: 'var(--accent)' }}>.</span>
        </h1>
      </div>

      <div className="hero-bottom">
        <p className="hero-bio">
          Founder, CEO &amp; agri-tech operator building WhiteRabbit Agro,
          OriginTrace and FarmWise — three platforms building the compliance,
          traceability, and farm digitization infrastructure that connects
          African agriculture to global markets.
        </p>
        <div className="hero-ctas">
          <button className="btn btn-primary" onClick={() => onNav('book')}>
            Book a consultation <span className="arrow" />
          </button>
          <button className="btn btn-ghost-inv" onClick={() => onNav('about')}>
            Learn more <span className="arrow" />
          </button>
        </div>
        <div className="hero-quick">
          <b>The work</b>
          Commercial plantation development · Herbs &amp; Spices<br />
          EUDR / UK / US / CN / UAE<br />
          B2B SaaS · Agro real estate
        </div>
      </div>
    </section>
  )
}

/* =============================================================
   STATS BAR
   ============================================================= */
export function StatsBar() {
  const ref = useReveal()
  const stats = [
    { n: '20', sup: '+', l: 'Hectares developed' },
    { n: '03', sup: '',  l: 'Active ventures' },
    { n: '05', sup: '',  l: 'Export markets' },
    { n: '01', sup: '',  l: 'Clear mission' },
  ]

  return (
    <section className="stats-bar" id="stats">
      <div className="grid reveal-stagger" ref={ref}>
        {stats.map((s, i) => (
          <div className="stat" key={i}>
            <div className="n">
              {s.n}
              {s.sup && <sup>{s.sup}</sup>}
            </div>
            <div className="lbl">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* =============================================================
   ABOUT
   ============================================================= */
function PortraitFigure() {
  return (
    <svg viewBox="0 0 400 460" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="figGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3a3531" />
          <stop offset="100%" stopColor="#1a1816" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="170" r="140" fill="none" stroke="rgba(246,244,239,0.08)" strokeWidth="1" />
      <circle cx="200" cy="170" r="100" fill="none" stroke="rgba(246,244,239,0.05)" strokeWidth="1" />
      <ellipse cx="200" cy="170" rx="78" ry="92" fill="url(#figGrad)" />
      <rect x="172" y="240" width="56" height="50" rx="14" fill="url(#figGrad)" />
      <path d="M40 460 C 40 360, 110 290, 200 290 C 290 290, 360 360, 360 460 Z"
        fill="url(#figGrad)" />
      <path d="M170 295 L 200 360 L 230 295" stroke="rgba(246,244,239,0.08)" strokeWidth="1.5" fill="none" />
      <circle cx="296" cy="92" r="6" fill="var(--accent)" />
    </svg>
  )
}

export function About() {
  const ref = useReveal()
  return (
    <section className="section" id="about" aria-label="About Obi Emeka">
      <div className="section-head reveal" ref={ref}>
        <div>
          <span className="lab">— 01 · About</span>
          <h2>
            Building the rails<br />
            <em>African agriculture</em><br />
            ships on.
          </h2>
        </div>
        <p className="lede">
          <b>Obi Emeka</b> is a Nigerian entrepreneur, CEO and agri-tech founder
          based in Enugu. He runs <b>WhiteRabbit Agro</b>, founded
          <b> OriginTrace</b> and <b>FarmWise</b>, and consults on the
          export-compliance and digitization problems that decide whether
          African commodities reach the world or stop at the port.
        </p>
      </div>

      <div className="about">
        <div className="about-portrait">
          <img
            src="/assets/obi-emeka-portrait.jpeg"
            alt="Obi Emeka — Nigerian agri-tech founder and CEO of WhiteRabbit Agro, photographed in 2026"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center top',
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(10,10,10,0.55) 0%, transparent 55%)',
            zIndex: 1,
          }} />
          <div className="portrait-meta">
            <span className="ph-lab">— OE / 2026</span>
            <span className="ph-name">Obi Emeka, CEO</span>
          </div>
        </div>

        <div className="about-body">
          <p className="lede">
            One operator, three companies, one thesis: the bottleneck
            isn't African supply — it's the infrastructure between farm
            and global market.
          </p>
          <p className="body-text">
            Across cocoa plantations in Enugu State, B2B compliance
            software for exporters, and digitization tools for
            governments and cooperatives, the work is the same shape —
            <b> remove the friction that keeps smallholder output from
            crossing borders</b>, and price the value that emerges.
          </p>
          <p className="body-text">
            He advises agri-tech founders on product strategy, structures
            agro real estate development &amp; management vehicles, and
            speaks regularly on export compliance and the future of African
            export trade.
          </p>

          <div className="about-credentials">
            <div className="cred">
              <span className="k">Based in</span>
              <span className="v">Enugu, Nigeria</span>
            </div>
            <div className="cred">
              <span className="k">Sector</span>
              <span className="v">Agriculture · Software Technology · Export</span>
            </div>
            <div className="cred">
              <span className="k">Operating since</span>
              <span className="v">2018</span>
            </div>
          </div>

          <div className="about-actions">
            <button className="btn btn-ink"
              onClick={() => document.getElementById('ventures')?.scrollIntoView({ behavior: 'smooth' })}>
              See the ventures <span className="arrow" />
            </button>
            <a className="btn btn-ghost" href="#book"
              onClick={(e) => { e.preventDefault(); document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' }) }}>
              Work with Obi <span className="arrow" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* =============================================================
   VENTURES
   ============================================================= */
const VENTURES = [
  {
    id: 'whiterabbit',
    num: '01',
    name: 'WhiteRabbit Agro',
    nameEm: 'Agro',
    tags: ['Agro real estate development & management', 'Enugu, NG'],
    desc: 'Agro real estate development & management — investors buy plantation plots, WhiteRabbit develops and runs them end-to-end through harvest, export and distribution, and profits are shared.',
    detail: {
      h: 'Agro real estate development & management — vertically integrated, from land acquisition and plot allocation through development, harvest, export sales and distribution. All in-house, on 20+ hectares of commercial cocoa in Enugu State.',
      stats: [
        { n: '20+ ha', l: 'Cocoa under development' },
        { n: '5–7yr',  l: 'Investor horizon' },
      ],
      url: 'https://whiterabbitagro.com/',
      urlLabel: 'whiterabbitagro.com',
    },
  },
  {
    id: 'origintrace',
    num: '02',
    name: 'OriginTrace',
    nameEm: 'Trace',
    tags: ['B2B SaaS', 'Compliance', 'Traceability'],
    desc: 'Multi-market export compliance and supply-chain traceability for African exporters — EUDR, UK, US, China, UAE from a single platform.',
    detail: {
      h: "One platform, five regulatory regimes. Geo-located plot data, deforestation due-diligence, document workflows and buyer-side audit trails — built for cooperatives and exporters who can't afford a regime per market.",
      stats: [
        { n: '05',   l: 'Markets covered' },
        { n: '100%', l: 'EUDR Article 9 ready' },
      ],
      url: 'https://origintrace.trade',
      urlLabel: 'origintrace.trade',
    },
  },
  {
    id: 'farmwise',
    num: '03',
    name: 'FarmWise',
    nameEm: 'Wise',
    tags: ['B2B SaaS', 'Farmer-first', 'Cooperatives & Govt'],
    desc: 'Empowering Nigerian farmers to run their farms like a business — GPS plot mapping, crop-cycle tracking, yield forecasts, and the farm record that unlocks loans, contracts and premium markets.',
    detail: {
      h: 'For farmers: map plots with GPS, track every crop cycle, forecast yields, and build the farm record that unlocks loans, contracts and premium markets. For cooperatives and government agencies: verified plot-level data to run efficient agricultural programs and make informed decisions.',
      stats: [
        { n: 'GPS',        l: 'Plot-level mapping' },
        { n: 'Plot-level', l: 'Verified farm records' },
      ],
      url: 'https://farmwise.whiterabbitagro.com/',
      urlLabel: 'farmwise.whiterabbitagro.com',
    },
  },
]

export function Ventures() {
  const [open, setOpen] = useState('origintrace')
  return (
    <section className="ventures-section" id="ventures" aria-label="Ventures and companies">
      <div className="section">
        <div className="section-head">
          <div>
            <span className="lab">— 02 · Ventures</span>
            <h2>
              Three companies.<br />
              <em>One thesis.</em>
            </h2>
          </div>
          <p className="lede">
            Each venture solves one cut of the same problem: getting
            African agricultural output to global markets at the speed,
            standard and price the world now expects.
            <b> Operated together, they compound.</b>
          </p>
        </div>

        <div className="venture-list">
          {VENTURES.map((v) => {
            const isOpen = open === v.id
            return (
              <React.Fragment key={v.id}>
                <div className="venture" onClick={() => setOpen(isOpen ? null : v.id)}>
                  <span className="v-num">— {v.num} / 03</span>
                  <h3 className="v-name">
                    {v.nameEm ? (
                      <>{v.name.replace(v.nameEm, '')}<em>{v.nameEm}</em></>
                    ) : v.name}
                  </h3>
                  <div className="v-meta">
                    <div className="v-tags">
                      {v.tags.map((t) => (
                        <span className="v-tag" key={t}>{t}</span>
                      ))}
                    </div>
                    <p className="v-desc">{v.desc}</p>
                  </div>
                  <span className="v-arrow" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                      <path d="M7 11h8M11 7l4 4-4 4" stroke="currentColor" strokeWidth="1.7"
                            strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
                <div className={`venture-detail ${isOpen ? 'open' : ''}`}>
                  <div className="vd-pad">
                    <div className="vd-grid">
                      <div>
                        <h4>{v.detail.h}</h4>
                        <div className="vd-cta">
                          <a className="btn btn-ink" href={v.detail.url}
                             target={v.detail.url.startsWith('http') ? '_blank' : '_self'}
                             rel="noreferrer">
                            Visit {v.detail.urlLabel} <span className="arrow" />
                          </a>
                          <a className="btn btn-ghost" href="#book"
                             onClick={(e) => { e.preventDefault(); document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' }) }}>
                            Discuss this <span className="arrow" />
                          </a>
                        </div>
                      </div>
                      <div className="vd-stats">
                        {v.detail.stats.map((s, i) => (
                          <div className="vd-stat" key={i}>
                            <div className="n">{s.n}</div>
                            <div className="l">{s.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* =============================================================
   PRESS / PARTNERS STRIP
   ============================================================= */
const PRESS_PARTNERS = [
  {
    name: 'Nigerian Export Promotion Council',
    short: 'NEPC',
    logo: '/assets/partners/nepc logo.png',
    acro: true,
  },
  {
    name: 'Union Bank',
    short: 'Union Bank',
    logo: '/assets/partners/union-bank.png',
    acro: false,
  },
  {
    name: 'Ministry of Agriculture & Agro-Industrialization, Enugu State',
    short: 'Enugu Agro Ministry',
    logo: '/assets/partners/ministry of agric enugu.png',
    acro: false,
  },
  {
    name: 'Vanguard',
    short: 'Vanguard',
    logo: '/assets/partners/Vanguard_Nigeria_logo.svg.png',
    acro: false,
  },
  {
    name: 'BusinessDay',
    short: 'BusinessDay',
    logo: '/assets/partners/businessday logo.png',
    acro: false,
  },
  {
    name: 'Channels TV',
    short: 'Channels TV',
    logo: '/assets/partners/Channels_TV.png',
    acro: false,
  },
  {
    name: 'BBC News',
    short: 'BBC News',
    logo: '/assets/partners/BBC_News-Logo.wine.png',
    acro: false,
  },
  {
    name: 'This Day',
    short: 'This Day',
    logo: '/assets/partners/this day logo.png',
    acro: false,
  },
]

export function Press() {
  const doubled = [...PRESS_PARTNERS, ...PRESS_PARTNERS]
  return (
    <section className="press">
      <p className="press-label">— Featured &amp; Partnered with</p>
      <div className="press-marquee">
        <div className="press-track">
          {doubled.map((p, i) => (
            <PartnerLogo key={`${p.name}-${i}`} partner={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PartnerLogo({ partner }) {
  const [imgFailed, setImgFailed] = React.useState(false)
  if (partner.logo && !imgFailed) {
    return (
      <span className="partner" title={partner.name}>
        <img
          src={partner.logo}
          alt={partner.short}
          onError={() => setImgFailed(true)}
        />
      </span>
    )
  }
  return (
    <span className="partner partner-text">{partner.short}</span>
  )
}

/* =============================================================
   EXPERTISE
   ============================================================= */
export function Expertise() {
  const items = [
    {
      n: '01',
      h: 'Export compliance strategy',
      p: 'EUDR, UK Forest Risk Commodities, US, China, UAE — building the documentation, traceability and due-diligence stack that lets African product clear customs anywhere it sells.',
    },
    {
      n: '02',
      h: 'Agro real estate development & management',
      p: 'Designing and operating agro real estate vehicles end-to-end — plot allocation, development, harvest, export sales, distribution, and investor revenue share.',
    },
    {
      n: '03',
      h: 'Agri-tech product strategy',
      p: 'Roadmap and positioning for B2B platforms serving exporters, cooperatives and ministries. What to build, what to buy, what to ignore in year one.',
    },
    {
      n: '04',
      h: 'Supply-chain traceability',
      p: "Plot-to-port data architectures: geo-located farms, batch-level provenance, audit-ready reporting that survives a buyer's compliance team.",
    },
  ]

  return (
    <section className="section" id="expertise" aria-label="Areas of expertise">
      <div className="section-head">
        <div>
          <span className="lab">— 03 · Expertise</span>
          <h2>
            What I'm <em>good</em> at,<br />
            and only that.
          </h2>
        </div>
        <p className="lede">
          A short list. If your problem isn't on it, I'm probably not your
          person — and I'll tell you who is. <b>Working with someone whose
          edges are well-known beats working with a generalist.</b>
        </p>
      </div>

      <div className="expertise-grid">
        {items.map((it) => (
          <div className="expertise" key={it.n}>
            <span className="e-num">— {it.n}</span>
            <div>
              <h3>{it.h}</h3>
              <p>{it.p}</p>
            </div>
            <span className="e-arrow" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                <path d="M7 11h8M11 7l4 4-4 4" stroke="currentColor" strokeWidth="1.7"
                      strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* =============================================================
   SPEAKING
   ============================================================= */
export function Speaking({ onBookSpeaking }) {
  const topics = [
    {
      n: '01',
      h: 'Export compliance & EUDR readiness',
      p: 'For ministries, exporters and trade conferences. What the new regulatory regimes actually require, where most operators get tripped up, and the playbook for getting compliant in 90 days.',
    },
    {
      n: '02',
      h: 'African agri-tech & investment',
      p: "For investor forums, accelerators and founder summits. What's actually working in the space — and what raises money but doesn't solve the problem.",
    },
    {
      n: '03',
      h: 'Smallholder digitization',
      p: 'For governments, donors and cooperatives. How to take a paper-based farmer registry and turn it into something that unlocks credit, contracts and premium markets.',
    },
    {
      n: '04',
      h: 'Agro real estate as an asset class',
      p: 'For investor audiences and family offices. How vertically integrated agro real estate compares to traditional farmland investment, and the structures that make it work.',
    },
  ]

  return (
    <section className="section" id="speaking" aria-label="Speaking topics and engagements" style={{ borderTop: '1px solid var(--hairline-strong)' }}>
      <div className="section-head">
        <div>
          <span className="lab">— 04 · Speaking</span>
          <h2>
            Book Obi for a<br />
            <em>talk</em>, panel<br />
            or keynote.
          </h2>
        </div>
        <p className="lede">
          Available for keynotes, fireside chats, panels and workshops on
          the four areas below. <b>Each engagement is shaped to the
          audience</b> — investor forum, ministry briefing, founder
          conference or cooperative AGM.
        </p>
      </div>
      <div className="speaking-topics">
        {topics.map((it) => (
          <div className="speak-topic" key={it.n} onClick={() => onBookSpeaking(it.h)}>
            <span className="st-num">{it.n}</span>
            <div className="st-content">
              <h3>{it.h}</h3>
              <p>{it.p}</p>
            </div>
            <button className="st-cta" onClick={(e) => { e.stopPropagation(); onBookSpeaking(it.h) }}>
              Book this topic
            </button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 'var(--s-6)', display: 'flex', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
        <button className="btn btn-ink" onClick={() => onBookSpeaking()}>
          Request Obi for a speaking engagement <span className="arrow" />
        </button>
      </div>
    </section>
  )
}

/* =============================================================
   PACKAGES
   ============================================================= */
const PACKAGES = [
  {
    id: 'discovery',
    num: '01',
    name: 'Discovery Call',
    price: '₦150,000',
    intl: '$100 USD',
    per: '· 45 min',
    desc: 'A focused, paid intro call. Walk through your situation; leave with a frank assessment and 3 immediate written actions — whether the next step is with me or someone else.',
    items: [
      '45-minute video or in-person call (Enugu)',
      'Pre-read of any materials you share',
      'Honest fit assessment — does my expertise match the need',
      'Directional framing of the problem',
      'Written follow-up note with 3 immediate actions within 24hrs',
    ],
    note: 'One per organisation · Not credited toward a strategy session',
  },
  {
    id: 'compliance',
    num: '02',
    name: 'Compliance Audit Session',
    price: '₦400,000',
    intl: '$265 USD',
    per: '· 2 hrs + written assessment',
    desc: 'Live audit of your compliance position against one regulatory framework. Ends with a written gap assessment and prioritised 5-step remediation roadmap.',
    items: [
      'Pre-session intake questionnaire',
      '2-hour live audit against one framework (EUDR, UK, US Lacey, China, or UAE)',
      'Written compliance gap assessment within 48 hours',
      'Prioritised 5-step remediation roadmap',
      '30-day email follow-up access',
    ],
  },
  {
    id: 'strategy',
    num: '03',
    tag: 'Most booked',
    featured: true,
    name: 'Export Strategy Session',
    price: '₦750,000',
    intl: '$500 USD',
    per: '· 5 hrs cumulative',
    desc: 'The flagship engagement. Five cumulative working hours, a full written export strategy report, and a 14-day async follow-up window.',
    items: [
      '5 hours cumulative working time — split across sittings',
      'In-person in Enugu at no additional cost',
      'Outside Enugu: client covers travel and accommodation',
      'Full written export strategy report within 5 business days',
      'Market selection, buyer profile, compliance pathway',
      '14-day async follow-up via WhatsApp and email',
    ],
  },
  {
    id: 'investment',
    num: '04',
    name: 'Agri-Investment Advisory Session',
    price: '₦600,000',
    intl: '$400 USD',
    per: '· 3 hrs + written brief',
    desc: 'Structured advisory for investors evaluating Nigerian agri-land or commodity exposure. Includes a written investment brief and full conflict-of-interest disclosure.',
    items: [
      'Pre-session investor intake form',
      '3-hour advisory session — video or in-person Enugu',
      'Written investment brief: risk, returns, structure options, red flags',
      'WhiteRabbit Agro plantation overview where relevant',
      'Introductions to operators or verified land agents if appropriate',
      '30-day follow-up access',
    ],
  },
  {
    id: 'retainer',
    num: '05',
    name: 'Advisory Retainer',
    price: '₦850,000',
    intl: '$565 USD',
    per: '/ month',
    desc: 'Ongoing senior advisory for founders, exporters and operators who need a senior voice on tap. Written application required — maximum 2 active clients.',
    items: [
      'Two 90-minute strategy sessions per month',
      'Unlimited async access — WhatsApp, Slack, or email (24hr response)',
      'Document and deck review with 48hr turnaround',
      'Monthly written advisory note with priorities and recommendations',
      'Quarterly in-person session in Enugu or client location',
      'Network introductions where genuinely useful',
    ],
    note: 'Minimum 3 months · ₦2,550,000 total · invoiced monthly',
  },
]

export function Packages({ onPick }) {
  return (
    <section className="packages-section" id="packages">
      <div className="section">
        <div className="section-head">
          <div>
            <span className="lab">— 05 · Engagements</span>
            <h2>
              Five ways<br />
              to <em>work together</em>.
            </h2>
          </div>
          <p className="lede">
            Calibrated for the conversations I actually have — a paid intro call,
            a compliance audit, a full export strategy, an investor advisory, or
            a steady hand for an ongoing engagement. <b>Pick the one that fits.</b>
          </p>
        </div>

        <div className="packages">
          {PACKAGES.map((p) => (
            <div key={p.id} className={`pkg ${p.featured ? 'featured' : ''}`}
                 onClick={() => onPick(p.id)}>
              <div className="pkg-head">
                <span className="pkg-num">— {p.num} / 05</span>
                {p.tag && <span className="pkg-tag">{p.tag}</span>}
              </div>
              <h3 className="pkg-name">{p.name}</h3>
              <div className="pkg-price">
                <span className="pp">{p.price}</span>
                <span className="per">{p.per}</span>
              </div>
              {p.intl && <div className="pkg-intl">{p.intl} · international</div>}
              <p className="pkg-desc">{p.desc}</p>
              <ul className="pkg-list">
                {p.items.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
              {p.note && <p className="pkg-note">{p.note}</p>}
              <button className="pkg-cta"
                      onClick={(e) => { e.stopPropagation(); onPick(p.id) }}>
                {p.id === 'discovery'  ? 'Book the call →' :
                 p.id === 'compliance' ? 'Book audit →' :
                 p.id === 'strategy'   ? 'Reserve a session →' :
                 p.id === 'investment' ? 'Book session →' :
                 'Apply for retainer →'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* =============================================================
   SOCIAL
   ============================================================= */
const SOCIAL_ITEMS = [
  {
    name: 'Instagram',
    handle: '@theobiemeka',
    url: 'https://www.instagram.com/theobiemeka/',
    brand: '#E1306C',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    handle: '/in/obiemeka',
    url: 'https://www.linkedin.com/in/obiemeka/',
    brand: '#0A66C2',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    handle: '/obiemekaofficial',
    url: 'https://www.facebook.com/obiemekaofficial',
    brand: '#1877F2',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    handle: '@obi.emeka',
    url: 'https://www.tiktok.com/@obi.emeka',
    brand: '#161823',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    handle: '@obiemeka',
    url: 'https://www.youtube.com/@obiemeka',
    brand: '#FF0000',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
      </svg>
    ),
  },
]

export function Social() {
  return (
    <section className="section social-section" id="connect">
      <div className="section-head">
        <div>
          <span className="lab">— 07 · Connect</span>
          <h2>
            Read along.<br />
            <em>Argue back.</em>
          </h2>
        </div>
        <p className="lede">
          Notes from the field — what's working in agriculture right now,
          global trade compliance is changing, what investors are experiencing.
          Pick the channel that matches how you interact online. Connect with me.
        </p>
      </div>
      <div className="social-grid">
        {SOCIAL_ITEMS.map((s) => (
          <a
            className="social"
            href={s.url}
            key={s.name}
            target="_blank"
            rel="noreferrer"
            style={{ '--brand-color': s.brand }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="sicon">{s.icon}</div>
              <span className="sfoot">
                <span className="sarrow">
                  <svg width="12" height="12" viewBox="0 0 22 22" fill="none">
                    <path d="M7 11h8M11 7l4 4-4 4" stroke="currentColor" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
            </div>
            <div className="sgrow" />
            <div>
              <h3 className="sname">{s.name}</h3>
              <span className="shandle">{s.handle}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

/* =============================================================
   FOOTER
   ============================================================= */
export function Footer({ onNav }) {
  return (
    <footer className="site-foot">
      <div className="inner">

        <h2 className="foot-display">
          Let's build the <em>rails</em>.
        </h2>

        <div className="foot-grid">
          <div className="foot-col foot-id">
            <img className="foot-logo" src="/assets/logo-wordmark-inverse.png" alt="Obi Emeka" />
            <p>
              Founder &amp; CEO, WhiteRabbit Agro. Building OriginTrace and
              FarmWise. Based in Enugu, working everywhere African
              agriculture ships.
            </p>
            <span className="tag">
              oe@obiemeka.com<br />
              +234 (0) 810 344 6650
            </span>
          </div>
          <div className="foot-col">
            <h4>Site</h4>
            <ul>
              <li><a href="#about"     onClick={(e) => { e.preventDefault(); onNav('about') }}>About</a></li>
              <li><a href="#ventures"  onClick={(e) => { e.preventDefault(); onNav('ventures') }}>Ventures</a></li>
              <li><a href="#expertise" onClick={(e) => { e.preventDefault(); onNav('expertise') }}>Expertise</a></li>
              <li><a href="#speaking"  onClick={(e) => { e.preventDefault(); onNav('speaking') }}>Speaking</a></li>
              <li><a href="#packages"  onClick={(e) => { e.preventDefault(); onNav('packages') }}>Engagements</a></li>
              <li><a href="#book"      onClick={(e) => { e.preventDefault(); onNav('book') }}>Book a call</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Ventures</h4>
            <ul>
              <li><a href="https://whiterabbitagro.com/" target="_blank" rel="noreferrer">WhiteRabbit Agro</a></li>
              <li><a href="https://origintrace.trade" target="_blank" rel="noreferrer">OriginTrace</a></li>
              <li><a href="https://farmwise.whiterabbitagro.com/" target="_blank" rel="noreferrer">FarmWise</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Follow</h4>
            <ul>
              <li><a href="https://www.instagram.com/theobiemeka/" target="_blank" rel="noreferrer">Instagram</a></li>
              <li><a href="https://www.linkedin.com/in/obiemeka/"  target="_blank" rel="noreferrer">LinkedIn</a></li>
              <li><a href="https://www.facebook.com/obiemekaofficial" target="_blank" rel="noreferrer">Facebook</a></li>
              <li><a href="https://www.tiktok.com/@obi.emeka"     target="_blank" rel="noreferrer">TikTok</a></li>
              <li><a href="https://www.youtube.com/@obiemeka"     target="_blank" rel="noreferrer">YouTube</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Office</h4>
            <ul>
              <li><a href="#">Enugu, Nigeria</a></li>
              <li><a href="#">Lagos &amp; Abuja satellites</a></li>
              <li><a href="#">Remote, by appt</a></li>
            </ul>
          </div>
        </div>

        <div className="foot-bottom">
          <span>© 2026 Obi Emeka · obiemeka.com</span>
          <span>Built for repetition · Sharpened by use</span>
        </div>
      </div>
    </footer>
  )
}
