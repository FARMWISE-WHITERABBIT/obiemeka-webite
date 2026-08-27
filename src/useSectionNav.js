import { useNavigate, useLocation } from 'react-router-dom'

// Shared by Nav and Footer: on the homepage, jump straight to the section.
// From any other route, navigate home first with the section id as a hash —
// Home picks that hash up on mount and scrolls to it.
export function useSectionNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return function goTo(id) {
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate('/#' + id)
    }
  }
}
