import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUpRight, Share2 } from 'lucide-react'
import ScrollVideo from './ScrollVideo'

function Reveal({
  children,
  delay = 0,
  className = '',
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'span'
}) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Replays every time the element re-enters the viewport.
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const Tag = as
  return (
    <Tag
      ref={ref as never}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out will-change-transform ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
    >
      {children}
    </Tag>
  )
}

const NAV_LINKS = ['main', 'tiers', 'features', 'talk to us']

function Navbar() {
  return (
    <>
      <div className="fixed left-5 top-5 z-50 sm:left-8 sm:top-7 md:left-12">
        <Reveal>
          <a
            href="#"
            className="font-mono text-lg font-medium tracking-tight text-white drop-shadow-md sm:text-xl md:text-2xl"
          >
            (NOVA_AI)
          </a>
        </Reveal>
        <Reveal delay={150}>
          <div className="mt-6 font-mono text-[10px] text-white/60 sm:mt-8 sm:text-xs">
            [ v.01b ]
          </div>
        </Reveal>
      </div>

      <nav className="fixed right-5 top-5 z-50 sm:right-8 sm:top-7 md:right-12">
        <ul className="flex flex-col items-end gap-1.5 sm:gap-2">
          {NAV_LINKS.map((label, i) => (
            <li key={label}>
              <Reveal delay={100 + i * 120}>
                <a
                  href="#"
                  className="group flex items-center gap-1 font-mono text-xs text-white/80 drop-shadow-md transition-colors duration-300 hover:text-white sm:text-sm"
                >
                  {label}
                  <ArrowUpRight
                    size={14}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </a>
              </Reveal>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}

const CTA =
  'rounded-full border border-white/60 text-center font-mono text-xs uppercase tracking-[0.15em] text-white transition-all duration-300 hover:bg-white hover:text-black'

const SHARE_WRAP = 'absolute bottom-5 left-5 sm:bottom-6 sm:left-8 md:left-12'

function ShareButton() {
  return (
    <button
      type="button"
      aria-label="Share"
      className="text-white/80 transition-colors duration-300 hover:text-white"
    >
      <Share2 size={18} />
    </button>
  )
}

function SectionOne() {
  return (
    <section className="relative flex min-h-screen flex-col justify-end supports-[height:100svh]:min-h-[100svh]">
      <div className="relative flex flex-col gap-10 px-5 pb-16 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:px-8 md:px-12 md:pb-20">
        <h1 className="max-w-xl text-4xl font-medium uppercase leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
          <Reveal as="span" delay={100} className="block pl-6 sm:pl-12">
            Today AI
          </Reveal>
          <Reveal as="span" delay={220} className="block">
            Aligns <span className="font-light normal-case italic">with</span>
          </Reveal>
          <Reveal as="span" delay={340} className="block pl-10 sm:pl-20">
            // Bold
          </Reveal>
          <Reveal as="span" delay={460} className="block pl-16 sm:pl-32">
            Dreams
          </Reveal>
        </h1>

        <div className="flex w-full max-w-xs flex-col items-start">
          <Reveal
            delay={400}
            className="mb-6 flex w-full items-center justify-between font-mono text-white sm:mb-8"
          >
            <span className="text-lg">( A )</span>
            <span className="text-xs text-white/70">[ 001 /004 ]</span>
          </Reveal>

          <Reveal delay={520} className="w-full">
            <p className="mb-6 text-sm leading-relaxed text-white/85 drop-shadow-md sm:mb-8">
              NovaAI is where your bravest work finds its true expression. We
              hand you the means not only to form the future.
            </p>
          </Reveal>

          <Reveal delay={640} className="w-full">
            <a href="#" className={`block w-full px-8 py-3 ${CTA}`}>
              Begin Today
            </a>
          </Reveal>
        </div>
      </div>

      <Reveal delay={760} className={SHARE_WRAP}>
        <ShareButton />
      </Reveal>

      <Reveal
        delay={760}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 sm:bottom-6"
      >
        <ArrowDown size={18} className="animate-bounce text-white/80" />
      </Reveal>
    </section>
  )
}

function SectionTwo() {
  return (
    <section className="relative flex min-h-screen flex-col supports-[height:100svh]:min-h-[100svh]">
      <div className="relative flex flex-1 flex-col justify-center gap-10 px-5 pt-24 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8 sm:pt-0 md:px-12">
        <h2 className="max-w-sm text-4xl font-medium uppercase leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl">
          <Reveal as="span" delay={100} className="block">
            Learn <span className="font-light normal-case italic">to see</span>
          </Reveal>
          <Reveal as="span" delay={220} className="block">
            Brilliantly
          </Reveal>
        </h2>

        <Reveal
          delay={340}
          className="flex items-center justify-between font-mono text-white sm:justify-start sm:gap-16 md:gap-24"
        >
          <span className="text-lg">( B )</span>
          <span className="text-xs text-white/70">[ 002 /004 ]</span>
        </Reveal>
      </div>

      <div className="relative flex flex-col gap-10 px-5 pb-16 sm:px-8 md:px-12 md:pb-20">
        <Reveal delay={460}>
          <p className="max-w-xs text-sm leading-relaxed text-white/85 drop-shadow-md">
            Our AI doesn't just respond — it interprets, sharpens, and delivers.
            From outline to final render, it supplies the insight you want.
          </p>
        </Reveal>

        <Reveal
          delay={580}
          className="w-full max-w-xs sm:absolute sm:bottom-16 sm:left-1/2 sm:w-auto sm:max-w-none sm:-translate-x-1/2 md:bottom-20"
        >
          <a href="#" className={`block px-10 py-3 ${CTA}`}>
            Run The Demo
          </a>
        </Reveal>
      </div>

      <Reveal delay={700} className={SHARE_WRAP}>
        <ShareButton />
      </Reveal>
    </section>
  )
}

export default function App() {
  return (
    <div className="relative">
      <ScrollVideo />
      <Navbar />
      <main>
        <SectionOne />
        <div aria-hidden className="h-[80vh]" />
        <SectionTwo />
      </main>
    </div>
  )
}
