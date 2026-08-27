import React, { useEffect, useRef, useState } from 'react'
import { buildGreenCircleLink } from './lib/utm'

const SESSION_KEY = 'oe_gc_popup_shown'
// Sections where someone is actively filling out a brief or reading pricing —
// don't interrupt that with a community pitch mid-decision.
const SUPPRESS_SECTION_IDS = ['packages', 'book']

// Exit-intent popup (Component 4). Desktop only — mouseleave toward the top
// of the viewport has no equivalent on touch devices, so this never mounts
// its listener on mobile. Fires once per session, and stays silent while the
// visitor is inside a suppressed section (Engagements / Booking).
export function ExitIntentPopup() {
  const [visible, setVisible] = useState(false)
  const suppressedRef = useRef(false)

  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 900px) and (pointer: fine)').matches
    if (!isDesktop) return

    let alreadyShown = false
    try { alreadyShown = sessionStorage.getItem(SESSION_KEY) === '1' } catch { /* ignore */ }
    if (alreadyShown) return

    const sections = SUPPRESS_SECTION_IDS
      .map((id) => document.getElementById(id))
      .filter(Boolean)

    let io
    if (sections.length) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) suppressedRef.current = true
          })
          suppressedRef.current = sections.some((el) => {
            const r = el.getBoundingClientRect()
            return r.top < window.innerHeight && r.bottom > 0
          })
        },
        { threshold: 0 }
      )
      sections.forEach((el) => io.observe(el))
    }

    function onMouseLeave(e) {
      if (e.clientY > 24) return // only the top-edge exit, not the sides/bottom
      if (suppressedRef.current) return
      let shown = false
      try { shown = sessionStorage.getItem(SESSION_KEY) === '1' } catch { /* ignore */ }
      if (shown) return
      try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* ignore */ }
      setVisible(true)
    }

    document.addEventListener('mouseleave', onMouseLeave)
    return () => {
      document.removeEventListener('mouseleave', onMouseLeave)
      io?.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    function onKey(e) { if (e.key === 'Escape') setVisible(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [visible])

  if (!visible) return null

  const href = buildGreenCircleLink({ source: 'popup', medium: 'exit-intent' })

  return (
    <div className="gc-popup-overlay" role="dialog" aria-modal="true" aria-label="Join The Green Circle">
      <div className="gc-popup">
        <button className="gc-popup-close" aria-label="Close" onClick={() => setVisible(false)}>×</button>
        <img className="gc-popup-logo" src="/assets/green-circle-logo.png" alt="The Green Circle" />
        <span className="caps gc-popup-lab">— Before you go</span>
        <h3>A place to compare notes.</h3>
        <p>
          The Green Circle is a free WhatsApp group for investors,
          operators, and entrepreneurs working on real problems in African
          agriculture. Free to join.
        </p>
        <a className="btn btn-primary" href={href} onClick={() => setVisible(false)}>
          Join The Green Circle <span className="arrow" />
        </a>
      </div>
    </div>
  )
}
