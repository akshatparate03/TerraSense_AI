import React, { useEffect, useRef } from 'react'

/**
 * Full-viewport animated background: drifting gradient orbs (CSS) + a
 * lightweight canvas particle field (plain JS, no extra dependency). Used on
 * the landing page and auth screens for a premium, non-static feel.
 */
export default function AnimatedBackground({ variant = 'full' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    let particles = []
    let width = 0
    let height = 0

    const resize = () => {
      width = canvas.parentElement.offsetWidth
      height = canvas.parentElement.offsetHeight
      canvas.width = width
      canvas.height = height
      const count = Math.min(90, Math.floor((width * height) / 14000))
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        hue: Math.random() > 0.5 ? '34,211,238' : '59,130,246',
        alpha: Math.random() * 0.5 + 0.15,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.hue},${p.alpha})`
        ctx.fill()
      }
      // connecting lines for nearby particles - subtle constellation effect
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(34,211,238,${0.08 * (1 - dist / 110)})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-70" />
      <div className="orb orb-cyan" />
      <div className="orb orb-blue" />
      {variant === 'full' && <div className="orb orb-emerald" />}
      <div className="absolute inset-0 bg-grid-lines opacity-[0.15]" />
    </div>
  )
}
