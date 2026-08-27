import React from 'react'
import { buildGreenCircleLink } from './lib/utm'

// Fixed CTA block for the end of every blog post (and, on longer posts,
// an inline/sticky variant mid-post) — Component 1's per-post requirement.
// Every instance links to /green-circle tagged with UTM params identifying
// exactly which post and which position it came from (Component 5).
export function GreenCircleCTA({ campaign, topic, variant = 'end' }) {
  const href = buildGreenCircleLink({
    source: 'blog',
    medium: variant === 'end' ? 'cta-end' : 'cta-inline',
    campaign,
  })
  const label = topic
    ? `If ${topic} is something you're actively dealing with, The Green Circle is where operators, investors, and founders in this space compare notes — free to join.`
    : `The Green Circle is where operators, investors, and founders solving this exact kind of problem compare notes — free to join.`

  return (
    <div className={`gc-cta gc-cta-${variant}`}>
      <span className="caps gc-cta-lab">— The Green Circle</span>
      <p>{label}</p>
      <a className="btn btn-primary" href={href}>
        Join for free <span className="arrow" />
      </a>
    </div>
  )
}
