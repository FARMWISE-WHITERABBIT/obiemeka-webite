/* global React */
const { useState, useEffect, useRef } = React;

/* =============================================================
   useReveal — IntersectionObserver-driven reveal hook
   ============================================================= */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* =============================================================
   NAV
   ============================================================= */
function Nav({ accent, onNav, onPaperSection }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const items = [
  { id: 'about', label: 'About' },
  { id: 'ventures', label: 'Ventures' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'packages', label: 'Packages' },
  { id: 'connect', label: 'Connect' }];


  return (
    <header className={`nav ${solid ? 'solid' : ''} ${onPaperSection ? 'on-paper' : ''}`}>
      <div className="left" data-comment-anchor="20536bd3d7-div-51-7">
        <img className="mono-mark" src="assets/logo-wordmark.png" alt="Obi Emeka" />
      </div>
      <nav>
        <ul>
          {items.map((it) =>
          <li key={it.id}>
              <a
              href={`#${it.id}`}
              onClick={(e) => {
                e.preventDefault();
                onNav(it.id);
              }}>
              
                {it.label}
              </a>
            </li>
          )}
        </ul>
      </nav>
      <div className="right">
        <span className="nav-meta">EN ↗ Enugu, NG</span>
        <a
          href="#book"
          className="nav-cta"
          onClick={(e) => {
            e.preventDefault();
            onNav('book');
          }}>
          
          Book a call →
        </a>
      </div>
    </header>);

}

/* =============================================================
   HERO
   ============================================================= */
function Hero({ onNav }) {
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
          <b>Founder, CEO &amp; agri-tech operator</b> building the
          infrastructure that connects African agriculture to global
          markets — from 20-hectare cocoa plantations in Enugu to
          export-compliance software shipping in five regulatory
          regimes.
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
          Cocoa · Cashew · Sesame<br />
          EUDR / UK / US / CN / UAE<br />
          B2B SaaS · Agri-real estate
        </div>
      </div>
    </section>);

}

/* =============================================================
   STATS BAR
   ============================================================= */
function StatsBar() {
  const ref = useReveal();
  const stats = [
  { n: '20', sup: '+', l: 'Hectares developed' },
  { n: '03', sup: '', l: 'Active ventures' },
  { n: '05', sup: '', l: 'Export markets' },
  { n: '01', sup: '', l: 'Clear mission' }];

  return (
    <section className="stats-bar" id="stats">
      <div className="grid reveal-stagger" ref={ref}>
        {stats.map((s, i) =>
        <div className="stat" key={i}>
            <div className="n">
              {s.n}
              {s.sup && <sup>{s.sup}</sup>}
            </div>
            <div className="lbl">{s.l}</div>
          </div>
        )}
      </div>
    </section>);

}

/* =============================================================
   ABOUT
   ============================================================= */
function PortraitFigure() {
  // A tasteful silhouette placeholder — never tries to be a real photo.
  // Big shoulders + head, monolinear, citrus accent ring above.
  return (
    <svg viewBox="0 0 400 460" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="figGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3a3531" />
          <stop offset="100%" stopColor="#1a1816" />
        </linearGradient>
      </defs>
      {/* halo ring */}
      <circle cx="200" cy="170" r="140" fill="none" stroke="rgba(246,244,239,0.08)" strokeWidth="1" />
      <circle cx="200" cy="170" r="100" fill="none" stroke="rgba(246,244,239,0.05)" strokeWidth="1" />
      {/* head */}
      <ellipse cx="200" cy="170" rx="78" ry="92" fill="url(#figGrad)" />
      {/* neck */}
      <rect x="172" y="240" width="56" height="50" rx="14" fill="url(#figGrad)" />
      {/* shoulders + body */}
      <path
        d="M40 460 C 40 360, 110 290, 200 290 C 290 290, 360 360, 360 460 Z"
        fill="url(#figGrad)" />
      
      {/* lapel hint */}
      <path d="M170 295 L 200 360 L 230 295" stroke="rgba(246,244,239,0.08)" strokeWidth="1.5" fill="none" />
      {/* citrus accent — small dot, "the dot matters" */}
      <circle cx="296" cy="92" r="6" fill="var(--accent)" />
    </svg>);

}

function About() {
  const ref = useReveal();
  return (
    <section className="section" id="about">
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
          <div className="portrait-canvas" />
          <div className="portrait-figure"><PortraitFigure /></div>
          <span className="portrait-stamp">PORTRAIT · DRAG TO REPLACE</span>
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
          <p className="body-text" data-comment-anchor="de1991ff44-p-260-11">
            Across cocoa plantations in Enugu State, B2B compliance
            software for exporters, and digitization tools for
            governments and cooperatives, the work is the same shape —
            <b> remove the friction that keeps smallholder output from
            crossing borders</b>, and price the value that emerges.
          </p>
          <p className="body-text">
            He advises agri-tech founders on product strategy, structures
            agricultural investment vehicles, and speaks regularly on
            EUDR readiness and the future of African export trade.
          </p>

          <div className="about-credentials">
            <div className="cred">
              <span className="k">Based in</span>
              <span className="v">Enugu, Nigeria</span>
            </div>
            <div className="cred">
              <span className="k">Sector</span>
              <span className="v">Agri · Export · SaaS</span>
            </div>
            <div className="cred">
              <span className="k">Operating since</span>
              <span className="v">2018</span>
            </div>

          </div>

          <div className="about-actions">
            <button
              className="btn btn-ink"
              onClick={() =>
              document.getElementById('ventures')?.scrollIntoView({ behavior: 'smooth' })
              }>
              
              See the ventures <span className="arrow" />
            </button>
            <a className="btn btn-ghost" href="#book"
            onClick={(e) => {e.preventDefault();document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' });}}>
              Work with Obi <span className="arrow" />
            </a>
          </div>
        </div>
      </div>
    </section>);

}

/* =============================================================
   VENTURES
   ============================================================= */
const VENTURES = [
{
  id: 'whiterabbit',
  num: '01',
  name: 'WhiteRabbit Agro',
  nameEm: null,
  tags: ['Agro real estate development & management', 'Enugu, NG'],
  desc: 'Agro real estate development & management — investors buy plantation plots, WhiteRabbit develops and runs them end-to-end through harvest, export and distribution, and profits are shared.',
  detail: {
    h: 'Agro real estate development & management — vertically integrated, from land acquisition and plot allocation through development, harvest, export sales and distribution. All in-house, on 20+ hectares of commercial cocoa in Enugu State.',
    stats: [
    { n: '20+ ha', l: 'Cocoa under development' },
    { n: '5–7yr', l: 'Investor horizon' }],

    url: '#',
    urlLabel: 'whiterabbitagro.com'
  }
},
{
  id: 'origintrace',
  num: '02',
  name: 'OriginTrace',
  nameEm: 'Trace',
  tags: ['B2B SaaS', 'Compliance', 'Traceability'],
  desc: 'Multi-market export compliance and supply-chain traceability for African exporters — EUDR, UK, US, China, UAE from a single platform.',
  detail: {
    h: 'One platform, five regulatory regimes. Geo-located plot data, deforestation due-diligence, document workflows and buyer-side audit trails — built for cooperatives and exporters who can\'t afford a regime per market.',
    stats: [
    { n: '05', l: 'Markets covered' },
    { n: '100%', l: 'EUDR Article 9 ready' }],

    url: 'https://origintrace.trade',
    urlLabel: 'origintrace.trade'
  }
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
    { n: 'GPS', l: 'Plot-level mapping' },
    { n: 'Plot-level', l: 'Verified farm records' }],

    url: '#',
    urlLabel: 'farmwise.africa'
  }
}];


function Ventures() {
  const [open, setOpen] = useState('origintrace');
  return (
    <section className="ventures-section" id="ventures">
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
            const isOpen = open === v.id;
            return (
              <React.Fragment key={v.id}>
                <div
                  className="venture"
                  onClick={() => setOpen(isOpen ? null : v.id)}>
                  
                  <span className="v-num">— {v.num} / 03</span>
                  <h3 className="v-name">
                    {v.nameEm ?
                    <>
                        {v.name.replace(v.nameEm, '')}
                        <em>{v.nameEm}</em>
                      </> :

                    v.name
                    }
                  </h3>
                  <div className="v-meta">
                    <div className="v-tags">
                      {v.tags.map((t) =>
                      <span className="v-tag" key={t}>{t}</span>
                      )}
                    </div>
                    <p className="v-desc">{v.desc}</p>
                  </div>
                  <span className="v-arrow" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                      <path d="M7 11h8M11 7l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
                <div className={`venture-detail ${isOpen ? 'open' : ''}`}>
                  <div className="vd-pad">
                    <div className="vd-grid">
                      <div>
                        <h4>{v.detail.h}</h4>
                        <div className="vd-cta">
                          <a className="btn btn-ink" href={v.detail.url} target={v.detail.url.startsWith('http') ? '_blank' : '_self'} rel="noreferrer">
                            Visit {v.detail.urlLabel} <span className="arrow" />
                          </a>
                          <a className="btn btn-ghost" href="#book"
                          onClick={(e) => {e.preventDefault();document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' });}}>
                            Discuss this <span className="arrow" />
                          </a>
                        </div>
                      </div>
                      <div className="vd-stats">
                        {v.detail.stats.map((s, i) =>
                        <div className="vd-stat" key={i}>
                            <div className="n">{s.n}</div>
                            <div className="l">{s.l}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>);

          })}
        </div>
      </div>
    </section>);

}

/* =============================================================
   PRESS / PARTNERS STRIP
   ============================================================= */
function Press() {
  const partners = [
  { name: 'NEPC', acro: true },
  { name: 'Union Bank', acro: false },
  { name: 'Federal Ministry of Agriculture & Food Security', acro: false },
  { name: 'Ministry of Agro-Industrialization', acro: false }];

  return (
    <section className="press" data-comment-anchor="adf8465692-section-474-5">
      <div className="row">
        <span className="label">— Featured / Partnered with</span>
        <div className="partners">
          {partners.map((p) =>
          <span key={p.name} className={`partner ${p.acro ? 'acro' : ''}`}>{p.name}</span>
          )}
        </div>
      </div>
    </section>);

}

/* =============================================================
   EXPERTISE
   ============================================================= */
function Expertise() {
  const items = [
  {
    n: '01',
    h: 'Export compliance strategy',
    p: 'EUDR, UK Forest Risk Commodities, US, China, UAE — building the documentation, traceability and due-diligence stack that lets African product clear customs anywhere it sells.'
  },
  {
    n: '02',
    h: 'Agro real estate development & management',
    p: 'Designing and operating agro real estate vehicles end-to-end — plot allocation, development, harvest, export sales, distribution, and investor revenue share.'
  },
  {
    n: '03',
    h: 'Agri-tech product strategy',
    p: 'Roadmap and positioning for B2B platforms serving exporters, cooperatives and ministries. What to build, what to buy, what to ignore in year one.'
  },
  {
    n: '04',
    h: 'Supply-chain traceability',
    p: 'Plot-to-port data architectures: geo-located farms, batch-level provenance, audit-ready reporting that survives a buyer\'s compliance team.'
  }];

  return (
    <section className="section" id="expertise">
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
        {items.map((it) =>
        <div className="expertise" key={it.n}>
            <span className="e-num">— {it.n}</span>
            <div>
              <h3>{it.h}</h3>
              <p>{it.p}</p>
            </div>
            <span className="e-arrow" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                <path d="M7 11h8M11 7l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        )}
      </div>
    </section>);

}

/* =============================================================
   PACKAGES
   ============================================================= */
const PACKAGES = [
{
  id: 'discovery',
  num: '01',
  tag: '60 minutes',
  name: 'Discovery Call',
  price: '₦50,000',
  per: '· 60 min',
  desc: 'A focused, paid intro call. Walk through your situation; leave with a frank assessment and direction — whether the next step is with me or someone else.',
  items: [
  '60-minute video or in-person call (Enugu)',
  'Pre-read of any materials you share',
  'Honest assessment of fit and approach',
  'Short written follow-up with next steps']

},
{
  id: 'strategy',
  num: '02',
  tag: 'Most booked',
  featured: true,
  name: 'Strategy Session',
  price: '₦450,000',
  per: '· 3 hrs cumulative',
  desc: 'A deep, single-topic working engagement. Three cumulative hours, scheduled across one or more sittings, ending with a written, ranked plan.',
  items: [
  '3 hours cumulative working time (split as needed)',
  'In-person in Enugu at no additional cost',
  'Outside Enugu: client covers flight & accommodation',
  'Pre-read review + written ranked next steps',
  '14-day async follow-up window']

},
{
  id: 'retainer',
  num: '03',
  tag: 'Limited slots',
  name: 'Advisory Retainer',
  price: '₦400,000',
  per: '/ month',
  desc: 'Ongoing advisory for founders, ministries, and operators who need a senior voice on tap.',
  items: [
  'Two 60-minute sessions per month',
  'Async access (Slack / WhatsApp / email)',
  'Doc and deck review turnaround in 48h',
  'Quarterly in-person if useful']

}];


function Packages({ onPick }) {
  return (
    <section className="packages-section" id="packages">
      <div className="section">
        <div className="section-head">
          <div>
            <span className="lab">— 04 · Engagements</span>
            <h2>
              Three ways<br />
              to <em>work together</em>.
            </h2>
          </div>
          <p className="lede">
            Calibrated for the conversations I actually have — a thirty-minute
            yes/no, a focused single-problem session, or a steady hand for
            an ongoing thing. <b>Pick the smallest one that fits.</b>
          </p>
        </div>

        <div className="packages">
          {PACKAGES.map((p) =>
          <div
            key={p.id}
            className={`pkg ${p.featured ? 'featured' : ''}`}
            onClick={() => onPick(p.id)}>
            
              <div className="pkg-head">
                <span className="pkg-num">— {p.num} / 03</span>
                <span className="pkg-tag">{p.tag}</span>
              </div>
              <h3 className="pkg-name">{p.name}</h3>
              <div className="pkg-price">
                <span className="pp">{p.price}</span>
                <span className="per">{p.per}</span>
              </div>
              <p className="pkg-desc">{p.desc}</p>
              <ul className="pkg-list">
                {p.items.map((it, i) =>
              <li key={i}>{it}</li>
              )}
              </ul>
              <button
              className="pkg-cta"
              onClick={(e) => {
                e.stopPropagation();
                onPick(p.id);
              }}>
              
                {p.id === 'discovery' ? 'Book the call →' : p.id === 'strategy' ? 'Reserve a session →' : 'Apply for retainer →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>);

}

/* =============================================================
   SOCIAL
   ============================================================= */
function Social() {
  const items = [
  { name: 'LinkedIn', handle: '/in/obiemeka', cta: 'Connect', meta: 'Long form' },
  { name: 'Facebook', handle: '/obiemeka', cta: 'Follow', meta: 'Updates' },
  { name: 'Twitter / X', handle: '@obiemeka', cta: 'Follow', meta: 'Daily' },
  { name: 'Instagram', handle: '@obi.emeka', cta: 'Follow', meta: 'From the field' },
  { name: 'YouTube', handle: '@obiemeka', cta: 'Subscribe', meta: 'Long-form' }];

  return (
    <section className="section social-section" id="connect">
      <div className="section-head">
        <div>
          <span className="lab">— 05 · Connect</span>
          <h2>
            Read along.<br />
            <em>Argue back.</em>
          </h2>
        </div>
        <p className="lede">
          Notes from the field — what's working in cocoa right now, where
          EUDR is biting, what investors are asking. Pick the channel that
          matches how you read.
        </p>
      </div>
      <div className="social-grid">
        {items.map((s) =>
        <a className="social" href="#" key={s.name} onClick={(e) => e.preventDefault()}>
            <div>
              <h3 className="sname">{s.name}</h3>
              <span className="shandle">{s.handle}</span>
            </div>
            <div className="sgrow" />
            <div className="sfoot">
              <span>{s.meta} · {s.cta}</span>
              <span className="arrow" />
            </div>
          </a>
        )}
      </div>
    </section>);

}

/* =============================================================
   FOOTER
   ============================================================= */
function Footer({ onNav }) {
  return (
    <footer className="site-foot">
      <div className="inner">
        <h2 className="foot-display">
          Let's build the <em>rails</em>.
        </h2>

        <div className="foot-grid">
          <div className="foot-col foot-id">
            <img src="assets/logo-wordmark-inverse.png" alt="Obi Emeka" data-comment-anchor="612ad294a4-img-719-13" />
            <p style={{ color: 'rgba(246,244,239,0.7)', maxWidth: '32ch' }}>
              Founder &amp; CEO, WhiteRabbit Agro. Building OriginTrace and
              FarmWise. Based in Enugu, working everywhere African
              agriculture ships.
            </p>
            <span className="tag">
              oe@obiemeka.com<br />
              +234 (0) 805 000 0000
            </span>
          </div>
          <div className="foot-col">
            <h4>Site</h4>
            <ul>
              <li><a onClick={() => onNav('about')} href="#about">About</a></li>
              <li><a onClick={() => onNav('ventures')} href="#ventures">Ventures</a></li>
              <li><a onClick={() => onNav('expertise')} href="#expertise">Expertise</a></li>
              <li><a onClick={() => onNav('packages')} href="#packages">Engagements</a></li>
              <li><a onClick={() => onNav('book')} href="#book">Book a call</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Ventures</h4>
            <ul>
              <li><a href="#">WhiteRabbit Agro</a></li>
              <li><a href="https://origintrace.trade" target="_blank" rel="noreferrer">OriginTrace</a></li>
              <li><a href="#">FarmWise</a></li>
              <li><a href="#">Agro Real Estate (under WhiteRabbit)</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Read</h4>
            <ul>
              <li><a href="#">Facebook</a></li>
              <li><a href="#">LinkedIn</a></li>
              <li><a href="#">YouTube</a></li>
              <li><a href="#">Talks &amp; press</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Office</h4>
            <ul>
              <li><a href="#">Enugu, Nigeria</a></li>
              <li><a href="#">Lagos satellite</a></li>
              <li><a href="#">Remote, by appt</a></li>
            </ul>
          </div>
        </div>

        <div className="foot-bottom">
          <span>© 2026 Obi Emeka · obiemeka.com</span>
          <span>Built for repetition · Sharpened by use</span>
        </div>
      </div>
    </footer>);

}

/* =============================================================
   Export to window
   ============================================================= */
/* =============================================================
   SPEAKING
   ============================================================= */
function Speaking({ onBookSpeaking }) {
  const topics = [
    {
      n: '01',
      h: 'Export compliance & EUDR readiness',
      p: 'For ministries, exporters and trade conferences. What the new regulatory regimes actually require, where most operators get tripped up, and the playbook for getting compliant in 90 days.'
    },
    {
      n: '02',
      h: 'African agri-tech & investment',
      p: 'For investor forums, accelerators and founder summits. What\'s actually working in the space — and what raises money but doesn\'t solve the problem.'
    },
    {
      n: '03',
      h: 'Smallholder digitization',
      p: 'For governments, donors and cooperatives. How to take a paper-based farmer registry and turn it into something that unlocks credit, contracts and premium markets.'
    },
    {
      n: '04',
      h: 'Agro real estate as an asset class',
      p: 'For investor audiences and family offices. How vertically integrated agro real estate compares to traditional farmland investment, and the structures that make it work.'
    }
  ];
  return (
    <section className="section" id="speaking" style={{ borderTop: '1px solid var(--hairline-strong)' }}>
      <div className="section-head">
        <div>
          <span className="lab">— 05 · Speaking</span>
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
      <div className="expertise-grid">
        {topics.map((it) => (
          <div className="expertise" key={it.n} onClick={() => onBookSpeaking(it.h)} style={{ cursor: 'pointer' }}>
            <span className="e-num">— {it.n}</span>
            <div>
              <h3>{it.h}</h3>
              <p>{it.p}</p>
            </div>
            <span className="e-arrow" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                <path d="M7 11h8M11 7l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 'var(--s-6)', display: 'flex', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
        <button className="btn btn-ink" onClick={() => onBookSpeaking()}>
          Request Obi for a speaking engagement <span className="arrow" />
        </button>
      </div>
    </section>
  );
}

Object.assign(window, { Speaking });