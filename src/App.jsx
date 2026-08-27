import React, { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import GreenCircle from './pages/GreenCircle'
import BlogIndex from './pages/BlogIndex'
import BlogPost from './pages/BlogPost'
import { ExitIntentPopup } from './ExitIntentPopup'
import { TweaksPanel, TweakSection, TweakRadio, useTweaks } from './TweaksPanel'

const TWEAK_DEFAULTS = {
  accent: 'green',
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
        <Route path="/green-circle" element={<GreenCircle />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="*" element={<Home />} />
      </Routes>

      {location.pathname !== '/green-circle' && <ExitIntentPopup />}

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
