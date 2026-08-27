import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Home from './pages/Home'
import GreenCircle from './pages/GreenCircle'
import BlogIndex from './pages/BlogIndex'
import BlogPost from './pages/BlogPost'
import { ExitIntentPopup } from './ExitIntentPopup'
import { TweaksPanel, TweakSection, TweakRadio, useTweaks } from './TweaksPanel'

const TWEAK_DEFAULTS = {
  accent: 'green',
}

// /green-circle was the page's slug before it moved to /greencircle-community —
// keep the old path working (with UTM params intact) for anything already
// linking to it.
function RedirectPreservingSearch({ to }) {
  const location = useLocation()
  return <Navigate to={to + location.search} replace />
}

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS)
  const location = useLocation()

  useEffect(() => {
    document.body.classList.remove('accent-citrus', 'accent-rust', 'accent-aqua', 'accent-green')
    document.body.classList.add('accent-' + t.accent)
  }, [t.accent])

  // Scroll to top on a real route change — but not when the new URL carries
  // a #section hash (Home's own effect handles scrolling to that section).
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/greencircle-community" element={<GreenCircle />} />
        <Route path="/green-circle" element={<RedirectPreservingSearch to="/greencircle-community" />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="*" element={<Home />} />
      </Routes>

      {location.pathname !== '/greencircle-community' && <ExitIntentPopup />}

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

      <Analytics />
    </>
  )
}
