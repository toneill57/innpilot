'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'

// Advanced animation hook using Intersection Observer
export function useIntersectionAnimation(
  threshold = 0.1,
  rootMargin = '0px'
) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // Once animated, stop observing for performance
          observer.unobserve(entry.target)
        }
      },
      { threshold, rootMargin }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return [ref, isVisible] as const
}

// Staggered animation for lists
export function StaggeredList({
  children,
  className = '',
  delay = 100,
  duration = 300
}: {
  children: ReactNode[]
  className?: string
  delay?: number
  duration?: number
}) {
  const [ref, isVisible] = useIntersectionAnimation()

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={`transition-all duration-${duration} ${
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
          style={{
            transitionDelay: isVisible ? `${index * delay}ms` : '0ms'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

// Fade in animation component
export function FadeIn({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  duration = 500
}: {
  children: ReactNode
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  delay?: number
  duration?: number
}) {
  const [ref, isVisible] = useIntersectionAnimation()

  const getTransformClass = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up': return 'translate-y-8'
        case 'down': return '-translate-y-8'
        case 'left': return 'translate-x-8'
        case 'right': return '-translate-x-8'
        default: return ''
      }
    }
    return 'translate-x-0 translate-y-0'
  }

  return (
    <div
      ref={ref}
      className={`transition-all duration-${duration} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${getTransformClass()} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// Scale animation component
export function ScaleIn({
  children,
  className = '',
  delay = 0,
  duration = 400
}: {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
}) {
  const [ref, isVisible] = useIntersectionAnimation()

  return (
    <div
      ref={ref}
      className={`transition-all duration-${duration} ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// Slide in animation
export function SlideIn({
  children,
  className = '',
  direction = 'left',
  delay = 0,
  duration = 500
}: {
  children: ReactNode
  className?: string
  direction?: 'left' | 'right' | 'up' | 'down'
  delay?: number
  duration?: number
}) {
  const [ref, isVisible] = useIntersectionAnimation()

  const getTransformClass = () => {
    if (!isVisible) {
      switch (direction) {
        case 'left': return '-translate-x-full'
        case 'right': return 'translate-x-full'
        case 'up': return '-translate-y-full'
        case 'down': return 'translate-y-full'
        default: return ''
      }
    }
    return 'translate-x-0 translate-y-0'
  }

  return (
    <div className="overflow-hidden">
      <div
        ref={ref}
        className={`transition-all duration-${duration} ${getTransformClass()} ${className}`}
        style={{ transitionDelay: `${delay}ms` }}
      >
        {children}
      </div>
    </div>
  )
}

// Text reveal animation
export function TextReveal({
  text,
  className = '',
  delay = 0,
  characterDelay = 50
}: {
  text: string
  className?: string
  delay?: number
  characterDelay?: number
}) {
  const [ref, isVisible] = useIntersectionAnimation()

  return (
    <span ref={ref} className={className}>
      {text.split('').map((char, index) => (
        <span
          key={index}
          className={`inline-block transition-all duration-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{
            transitionDelay: isVisible ? `${delay + index * characterDelay}ms` : '0ms'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  )
}

// Floating animation component
export function FloatingElement({
  children,
  className = '',
  amplitude = 10,
  duration = 3000
}: {
  children: ReactNode
  className?: string
  amplitude?: number
  duration?: number
}) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    let animationId: number
    let startTime: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp

      const progress = (timestamp - startTime) / duration
      const yOffset = Math.sin(progress * 2 * Math.PI) * amplitude

      element.style.transform = `translateY(${yOffset}px)`

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [amplitude, duration])

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  )
}

// Parallax scroll effect
export function ParallaxScroll({
  children,
  className = '',
  speed = 0.5,
  offset = 0
}: {
  children: ReactNode
  className?: string
  speed?: number
  offset?: number
}) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const element = elementRef.current
      if (!element) return

      const rect = element.getBoundingClientRect()
      const scrolled = window.scrollY
      const yPos = -(scrolled * speed) + offset

      element.style.transform = `translateY(${yPos}px)`
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed, offset])

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  )
}

// Card hover effect component
export function HoverCard({
  children,
  className = '',
  intensity = 'medium'
}: {
  children: ReactNode
  className?: string
  intensity?: 'light' | 'medium' | 'strong'
}) {
  const intensityClasses = {
    light: 'hover:translate-y-1 hover:shadow-md',
    medium: 'hover:-translate-y-2 hover:shadow-lg',
    strong: 'hover:-translate-y-4 hover:shadow-xl'
  }

  return (
    <div
      className={`transition-all duration-300 ease-out ${intensityClasses[intensity]} ${className}`}
    >
      {children}
    </div>
  )
}

// Button with ripple effect
export function RippleButton({
  children,
  onClick,
  className = '',
  variant = 'primary'
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'tropical'
}) {
  const [ripples, setRipples] = useState<Array<{ id: number, x: number, y: number }>>([])
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = (e: React.MouseEvent) => {
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newRipple = {
      id: Date.now(),
      x,
      y
    }

    setRipples(prev => [...prev, newRipple])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)

    onClick?.()
  }

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    tropical: 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white'
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={`relative overflow-hidden transition-colors duration-200 ${variantClasses[variant]} ${className}`}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white opacity-30 rounded-full animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </button>
  )
}

// Loading spinner with tropical theme
export function TropicalSpinner({
  size = 'md',
  className = ''
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="relative w-full h-full">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-200"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin"></div>
        <div className="absolute inset-1 rounded-full border border-transparent border-t-teal-400 animate-spin-reverse" style={{ animationDuration: '1.5s' }}></div>
      </div>
    </div>
  )
}

// Animated counter
export function AnimatedCounter({
  from = 0,
  to,
  duration = 2000,
  className = ''
}: {
  from?: number
  to: number
  duration?: number
  className?: string
}) {
  const [count, setCount] = useState(from)
  const [ref, isVisible] = useIntersectionAnimation()

  useEffect(() => {
    if (!isVisible) return

    const startTime = Date.now()
    const range = to - from

    const updateCount = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentCount = Math.floor(from + range * easeOutQuart)

      setCount(currentCount)

      if (progress < 1) {
        requestAnimationFrame(updateCount)
      }
    }

    updateCount()
  }, [isVisible, from, to, duration])

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString()}
    </span>
  )
}