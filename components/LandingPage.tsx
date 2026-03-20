'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const FAQ_ITEMS = [
  {
    q: 'Is this ATS-safe?',
    a: 'Yes. Every output is formatted for clean machine-reading and uses natural keyword placement — not stuffing. We specifically test against common ATS parsing patterns so your resume gets through the filter before a human ever sees it.',
  },
  {
    q: 'Will it sound like me?',
    a: 'The tool works from your master resume, so your voice, tone, and experience stay intact. We reframe — we never fabricate. Everything in the output is grounded in something you actually did.',
  },
  {
    q: 'What file formats do you support?',
    a: 'Upload PDF or Word (.docx), download in either format. You can edit the output in any word processor before sending.',
  },
  {
    q: "What if I don't like the output?",
    a: 'Every output is a starting point. Download it, edit it, make it yours. You can also regenerate with different parameters — more formal, more concise, more technical — until it feels right.',
  },
  {
    q: 'How is this different from Jobscan or resume builders?',
    a: "Jobscan tells you what keywords are missing. Resume builders give you templates. We actually rewrite your content for each specific job — and show you why every change was made. It's the difference between a diagnostic tool and a solution.",
  },
]

export default function LandingPage() {
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [navHidden, setNavHidden]     = useState(false)
  const [isAnnual, setIsAnnual]       = useState(false)
  const [openFaq, setOpenFaq]         = useState<number | null>(null)
  const lastScrollY = useRef(0)

  // Navbar hide/show on scroll
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY
      setNavHidden(current > lastScrollY.current && current > 80)
      lastScrollY.current = current
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fade-up IntersectionObserver
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.fade-up')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    els.forEach((el) => observer.observe(el))

    // Trigger hero elements immediately
    const heroEls = document.querySelectorAll<HTMLElement>('.lp-hero-bg .fade-up')
    heroEls.forEach((el) => setTimeout(() => el.classList.add('visible'), 100))

    return () => observer.disconnect()
  }, [])

  function toggleFaq(i: number) {
    setOpenFaq(openFaq === i ? null : i)
  }

  return (
    <div className="text-gray-800 bg-white antialiased">

      {/* ══ NAVBAR ══════════════════════════════════════════ */}
      <nav
        id="lp-navbar"
        className={`fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm${navHidden ? ' hidden-nav' : ''}`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <span className="text-white font-black text-sm">Ap</span>
            </div>
            <span className="text-xl font-black text-gray-900">Appli<span className="text-brand">matic</span></span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features"     className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">How it Works</a>
            <a href="#pricing"      className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">Reviews</a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login"  className="text-sm font-semibold text-gray-600 hover:text-brand transition-colors">Sign in</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full bg-brand text-white text-sm font-semibold shadow-md hover:bg-brandDark transition-all hover:scale-[1.03] hover:shadow-blue-300/50 hover:shadow-lg">
              Get started free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`lp-mobile-menu md:hidden bg-white border-t border-gray-100 px-4${mobileOpen ? ' open' : ''}`}>
          <div className="py-4 flex flex-col gap-4">
            <a href="#features"     onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 hover:text-brand">Features</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 hover:text-brand">How it Works</a>
            <a href="#pricing"      onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 hover:text-brand">Pricing</a>
            <a href="#testimonials" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 hover:text-brand">Reviews</a>
            <Link href="/signup" onClick={() => setMobileOpen(false)} className="text-center px-5 py-3 rounded-full bg-brand text-white text-sm font-semibold">
              Get started free
            </Link>
          </div>
        </div>
      </nav>


      {/* ══ HERO ════════════════════════════════════════════ */}
      <section className="lp-hero-bg pt-28 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-brand text-xs font-semibold mb-6 fade-up">
            <span className="text-yellow-400">✦</span> Now in beta — join 12,000+ job seekers on applimatic.ai
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-tight mb-6 fade-up" style={{ transitionDelay: '0.1s' }}>
            Your experience,<br/>
            <span className="text-brand">told perfectly</span> —<br/>
            for every job.
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed fade-up" style={{ transitionDelay: '0.2s' }}>
            Paste a job description. Upload your resume. Get a fully tailored resume + cover letter in 60 seconds — with an explanation of every single change we made.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5 fade-up" style={{ transitionDelay: '0.3s' }}>
            <Link href="/signup" className="px-8 py-4 rounded-full bg-brand text-white font-bold text-base shadow-lg w-full sm:w-auto hover:bg-brandDark hover:scale-[1.03] hover:shadow-blue-300/40 hover:shadow-xl transition-all">
              Tailor my first application free →
            </Link>
            <a href="#how-it-works" className="px-8 py-4 rounded-full border-2 border-gray-200 text-gray-700 font-semibold text-base hover:border-brand hover:text-brand hover:scale-[1.03] transition-all w-full sm:w-auto">
              See how it works
            </a>
          </div>
          <p className="text-xs text-gray-400 mb-14 fade-up" style={{ transitionDelay: '0.35s' }}>
            No credit card required &nbsp;•&nbsp; 3 free applications &nbsp;•&nbsp; Cancel anytime
          </p>

          {/* Before / After hero illustration */}
          <div className="fade-up max-w-4xl mx-auto" style={{ transitionDelay: '0.4s' }}>
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-3 text-xs text-gray-400 font-mono">applimatic.ai/dashboard</span>
              </div>

              <div className="grid grid-cols-2 divide-x divide-gray-100">
                {/* Before */}
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Before</span>
                    <span className="h-px flex-1 bg-gray-100"></span>
                  </div>
                  <div className="space-y-2.5 text-left">
                    <div className="h-2 bg-gray-200 rounded-full w-full"></div>
                    <div className="h-2 bg-gray-200 rounded-full w-5/6"></div>
                    <div className="h-2 bg-gray-100 rounded-full w-full mt-4"></div>
                    <div className="h-2 bg-gray-100 rounded-full w-4/5"></div>
                    <div className="h-2 bg-gray-100 rounded-full w-full"></div>
                    <div className="h-2 bg-gray-100 rounded-full w-3/4 mt-4"></div>
                    <div className="h-2 bg-gray-100 rounded-full w-full"></div>
                    <div className="h-2 bg-gray-100 rounded-full w-5/6"></div>
                    <div className="h-2 bg-gray-100 rounded-full w-2/3"></div>
                  </div>
                </div>

                {/* After */}
                <div className="p-5 sm:p-6 bg-blue-50/40 relative">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-brand">After</span>
                    <span className="h-px flex-1 bg-blue-100"></span>
                    <span className="text-xs text-emerald-600 font-semibold">✓ Tailored</span>
                  </div>
                  <div className="space-y-2.5 text-left relative">
                    <div className="relative">
                      <div className="h-2 rounded-full w-full overflow-hidden bg-gray-100">
                        <div className="h-full bg-blue-300 rounded-full sweep-highlight"></div>
                      </div>
                      <div className="tooltip-1 absolute -top-7 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                        Matched to job priority ✓
                      </div>
                    </div>
                    <div className="relative">
                      <div className="h-2 rounded-full w-5/6 overflow-hidden bg-gray-100">
                        <div className="h-full bg-blue-300 rounded-full sweep-line" style={{ animationDelay: '1s' }}></div>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full w-full mt-4"></div>
                    <div className="relative">
                      <div className="h-2 rounded-full w-4/5 overflow-hidden bg-gray-100">
                        <div className="h-full bg-green-200 rounded-full sweep-line" style={{ animationDelay: '1.2s' }}></div>
                      </div>
                      <div className="tooltip-2 absolute -top-7 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                        Reframed for this role ✓
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full w-full"></div>
                    <div className="h-2 bg-gray-100 rounded-full w-3/4 mt-4"></div>
                    <div className="relative">
                      <div className="h-2 rounded-full w-full overflow-hidden bg-gray-100">
                        <div className="h-full bg-blue-200 rounded-full sweep-line" style={{ animationDelay: '1.4s' }}></div>
                      </div>
                      <div className="tooltip-3 absolute -top-7 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                        ATS keyword added ✓
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full w-5/6"></div>
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
                <span className="text-xs text-gray-400">6 changes made &nbsp;•&nbsp; ATS score: <strong className="text-emerald-600">94%</strong></span>
                <Link href="/signup" className="text-xs font-semibold text-brand hover:underline">Download PDF →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ══ SOCIAL PROOF BAR ════════════════════════════════ */}
      <div className="bg-gray-50 border-y border-gray-100 py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Trusted by job seekers now working at</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {['Google', 'Stripe', 'Airbnb', 'McKinsey', 'Salesforce', 'OpenAI'].map(name => (
              <span key={name} className="text-gray-300 font-black text-lg tracking-tight">{name}</span>
            ))}
          </div>
        </div>
      </div>


      {/* ══ PROBLEM ═════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 fade-up">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">The Problem</span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mt-3 mb-6 leading-tight">
              You&rsquo;re qualified.<br/>Your resume just isn&rsquo;t telling them that.
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Hiring managers spend 7 seconds on a resume. If your bullets don&rsquo;t immediately map to what they&rsquo;re looking for, they move on — no matter how strong your background is. The problem isn&rsquo;t your experience. It&rsquo;s that every role wants a slightly different version of you, and manually rewriting your resume for each one takes 90 minutes you don&rsquo;t have.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: '🕐', title: '90 minutes per application', body: 'Tailoring resumes manually is exhausting and unsustainable at the scale modern job searching requires.' },
              { icon: '📭', title: '5% callback rate',            body: 'Generic resumes get filtered out before a human ever sees them — no matter how strong the underlying experience.', delay: '0.1s' },
              { icon: '😤', title: 'Rejections without feedback', body: "You never know what to fix. So nothing gets better. The same resume keeps getting the same result.", delay: '0.2s' },
            ].map(({ icon, title, body, delay }) => (
              <div key={title} className="fade-up bg-white rounded-2xl shadow-md border border-gray-100 border-t-4 border-t-brand p-6 hover:shadow-lg transition-shadow" style={delay ? { transitionDelay: delay } : {}}>
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ HOW IT WORKS ════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 fade-up">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">How it Works</span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight">Three steps. Sixty seconds.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 relative">
            <div className="hidden sm:flex absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-8 text-2xl text-blue-300 items-center justify-center z-10">→</div>
            <div className="hidden sm:flex absolute top-1/3 left-2/3 -translate-x-1/2 -translate-y-1/2 w-8 text-2xl text-blue-300 items-center justify-center z-10">→</div>
            {[
              { num: '1', icon: '🔍', title: 'Paste the job description', body: "Drop in the URL or paste the full text. We analyze what the company is really looking for — beyond just keywords.", bg: 'bg-brand' },
              { num: '2', icon: '☁️', title: 'Upload your resume once',   body: "We save it as your master profile. Add your full career history and we draw from it intelligently for every application.", bg: 'bg-brand', delay: '0.1s' },
              { num: '3', icon: '✨', title: 'Get your tailored application', body: "Tailored resume + cover letter, ready to download. Plus a full before/after view showing exactly what changed and why.", bg: 'bg-emerald-600', cardClass: 'bg-emerald-50 border-2 border-emerald-100', delay: '0.2s' },
            ].map(({ num, icon, title, body, bg, cardClass, delay }) => (
              <div key={num} className={`fade-up rounded-2xl shadow-md p-6 relative ${cardClass ?? 'bg-white'}`} style={delay ? { transitionDelay: delay } : {}}>
                <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full ${bg} text-white flex items-center justify-center text-sm font-black shadow`}>{num}</div>
                <div className="text-4xl mb-4 mt-2">{icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ FEATURES ════════════════════════════════════════ */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 fade-up">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">Features</span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mt-3 mb-4 leading-tight">Not keyword stuffing.<br/>Real rewriting.</h2>
            <p className="text-gray-500 max-w-xl mx-auto">The difference between a tool that inserts words and one that actually understands your story.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: '✏️', iconBg: 'bg-blue-50',    border: 'border-l-brand', title: 'Genuine Narrative Restructuring',        body: "We reorder your bullet points to lead with what this specific company cares about most. The output reads like it was written by someone who studied both your resume and their job description carefully — because that's exactly what happened." },
              { icon: '⚖️', iconBg: 'bg-blue-50',    border: 'border-l-brand', title: 'See Exactly What Changed and Why',       body: "Every tailored resume comes with a full before/after comparison view with annotations explaining each change. You're never left wondering why something was moved or rewritten — and you stay fully in control.", delay: '0.1s' },
              { icon: '✉️', iconBg: 'bg-emerald-50', border: 'border-l-emerald-500', title: 'Cover Letters That Sound Like You',   body: "We analyze the company's tone — their website, job description, LinkedIn presence — and write a cover letter that speaks their language while keeping your voice intact. No templates. No \"I am writing to express my interest in.\"", delay: '0.15s' },
              { icon: '♾️', iconBg: 'bg-emerald-50', border: 'border-l-emerald-500', title: 'One Master Resume, Infinite Applications', body: 'Upload your full career history once — every role, every project, every achievement. We draw from it selectively for each application, surfacing the most relevant details every single time.', delay: '0.2s' },
            ].map(({ icon, iconBg, border, title, body, delay }) => (
              <div key={title} className={`fade-up bg-white rounded-2xl border border-gray-100 shadow-sm p-6 border-l-4 ${border} hover:shadow-md transition-shadow`} style={delay ? { transitionDelay: delay } : {}}>
                <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center text-xl mb-4`}>{icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ TESTIMONIALS ════════════════════════════════════ */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 fade-up">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">Testimonials</span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight">Real job seekers.<br/>Real interviews.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { initials: 'SM', name: 'Sarah M.', role: 'Marketing Manager, New York', avatarBg: 'bg-blue-100', avatarColor: 'text-brand', quote: 'I sent 47 applications over three weeks and got zero callbacks. Then I tailored my next 12 with Applimatic and got <strong class="text-gray-800">4 interviews</strong>. I didn\'t add anything new to my resume — I just finally told my story in a way they could hear.' },
              { initials: 'JK', name: 'James K.',  role: 'Software Engineer, Austin',     avatarBg: 'bg-blue-100',    avatarColor: 'text-brand',  quote: 'The before/after view in Applimatic is what sold me. I could see exactly what it changed and why. I <strong class="text-gray-800">actually learned something</strong> about how to write better bullet points from watching it work.', delay: '0.1s' },
              { initials: 'PL', name: 'Priya L.',  role: 'Associate PM, Series B startup', avatarBg: 'bg-emerald-100', avatarColor: 'text-emerald-600', quote: 'I was trying to switch from finance into product management. This tool <strong class="text-gray-800">translated my experience</strong> in a way I never would have thought to do myself. Landed a PM role at a Series B in 6 weeks.', delay: '0.2s' },
            ].map(({ initials, name, role, avatarBg, avatarColor, quote, delay }) => (
              <div key={name} className="fade-up bg-white rounded-2xl shadow-md p-6 relative hover:shadow-lg transition-shadow" style={delay ? { transitionDelay: delay } : {}}>
                <div className="absolute top-5 right-6 text-6xl text-blue-100 font-serif leading-none select-none">&ldquo;</div>
                <div className="flex mb-3"><span className="text-yellow-400 text-sm">★★★★★</span></div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5" dangerouslySetInnerHTML={{ __html: `"${quote}"` }} />
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center ${avatarColor} font-bold text-sm`}>{initials}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{name}</p>
                    <p className="text-xs text-gray-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ PRICING ═════════════════════════════════════════ */}
      <section id="pricing" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 fade-up">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">Pricing</span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mt-3 mb-3 leading-tight">Simple pricing. No surprises.</h2>
            <p className="text-gray-500 max-w-md mx-auto">Start free. Upgrade when you&rsquo;re ready. Cancel anytime.</p>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mb-10 fade-up">
            <span className="text-sm font-semibold text-gray-700">Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isAnnual ? 'bg-brand' : 'bg-gray-200'}`}
              aria-label="Toggle annual billing"
            >
              <div
                className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300"
                style={{ transform: isAnnual ? 'translateX(24px)' : 'translateX(0)' }}
              />
            </button>
            <span className="text-sm font-semibold text-gray-700">Annual <span className="text-emerald-600 font-bold">(Save 20%)</span></span>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 items-start">
            {/* Free */}
            <div className="lp-pricing-card fade-up bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Free</p>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black text-gray-900">$0</span>
                  <span className="text-gray-400 mb-2">/month</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Forever free, no card needed</p>
              </div>
              <div className="p-6">
                <ul className="space-y-3 text-sm text-gray-600 mb-6">
                  {['3 Applimatic applications/month', 'Resume tailoring only', 'PDF download', 'Before/after comparison view'].map(f => (
                    <li key={f} className="flex items-start gap-2"><span className="text-emerald-600 font-bold mt-0.5">✓</span> {f}</li>
                  ))}
                  {['Cover letter generation', 'Application tracker'].map(f => (
                    <li key={f} className="flex items-start gap-2 text-gray-300"><span className="font-bold mt-0.5">✗</span> {f}</li>
                  ))}
                </ul>
                <Link href="/signup" className="block text-center py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-brand hover:text-brand transition-colors">
                  Get started free
                </Link>
              </div>
            </div>

            {/* Starter */}
            <div className="lp-pricing-card fade-up bg-white rounded-2xl border-2 border-brand shadow-xl overflow-hidden relative" style={{ transitionDelay: '0.1s' }}>
              <div className="absolute top-0 right-0 bg-brand text-white text-xs font-bold px-3 py-1 rounded-bl-xl">Most Popular</div>
              <div className="p-6 bg-blue-50 border-b border-blue-100">
                <p className="text-sm font-bold text-brand uppercase tracking-widest mb-2">Starter</p>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black text-gray-900">{isAnnual ? '$7' : '$9'}</span>
                  <span className="text-gray-400 mb-2">/month</span>
                </div>
                <p className="text-xs text-brand font-semibold mt-1">
                  {isAnnual ? 'Billed $84/year — save $24' : 'First month just $1 →'}
                </p>
              </div>
              <div className="p-6">
                <ul className="space-y-3 text-sm text-gray-600 mb-6">
                  {['20 Applimatic applications/month', 'Resume + cover letter', 'PDF + DOCX download', 'Application tracker', 'Before/after view with annotations'].map(f => (
                    <li key={f} className="flex items-start gap-2"><span className="text-emerald-600 font-bold mt-0.5">✓</span> {f}</li>
                  ))}
                  <li className="flex items-start gap-2 text-gray-300"><span className="font-bold mt-0.5">✗</span> Interview prep questions</li>
                </ul>
                <Link href="/signup" className="block text-center py-3 rounded-xl bg-brand text-white font-bold text-sm shadow-md hover:bg-brandDark transition-colors">
                  Start for $1 →
                </Link>
              </div>
            </div>

            {/* Pro */}
            <div className="lp-pricing-card fade-up bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden" style={{ transitionDelay: '0.2s' }}>
              <div className="p-6 bg-emerald-50 border-b border-emerald-100">
                <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-2">Pro</p>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black text-gray-900">{isAnnual ? '$15' : '$19'}</span>
                  <span className="text-gray-400 mb-2">/month</span>
                </div>
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  {isAnnual ? 'Billed $180/year — save $48' : 'Everything you need to get hired'}
                </p>
              </div>
              <div className="p-6">
                <ul className="space-y-3 text-sm text-gray-600 mb-6">
                  {['Unlimited applications', 'Everything in Starter', 'Interview question predictor', 'LinkedIn outreach drafts', 'Salary research brief', 'Priority processing'].map(f => (
                    <li key={f} className="flex items-start gap-2"><span className="text-emerald-600 font-bold mt-0.5">✓</span> {f}</li>
                  ))}
                </ul>
                <Link href="/signup" className="block text-center py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-colors">
                  Go Pro
                </Link>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">All Applimatic plans include a 7-day money-back guarantee. No questions asked.</p>
        </div>
      </section>


      {/* ══ FAQ ══════════════════════════════════════════════ */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12 fade-up">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">FAQ</span>
            <h2 className="text-4xl font-black text-gray-900 mt-3">Common questions</h2>
          </div>
          <div className="space-y-3 fade-up">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold text-gray-900 text-sm">{item.q}</span>
                  <span
                    className="text-brand text-xl font-bold flex-shrink-0 ml-4 transition-transform duration-300"
                    style={{ transform: openFaq === i ? 'rotate(45deg)' : 'none' }}
                  >+</span>
                </button>
                <div className={`faq-answer-inner px-6${openFaq === i ? ' open' : ''}`}>
                  <p className="text-gray-500 text-sm leading-relaxed pb-4">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ FINAL CTA ════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 bg-gradient-to-br from-brand to-brandDark text-white text-center">
        <div className="max-w-3xl mx-auto fade-up">
          <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">Start landing interviews,<br/>not rejections.</h2>
          <p className="text-blue-200 text-lg mb-8 max-w-lg mx-auto">Your first 3 applications are free. No credit card required.</p>
          <Link href="/signup" className="inline-block px-10 py-4 rounded-full bg-white text-brand font-black text-base shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all">
            Get started free →
          </Link>
          <p className="text-blue-300 text-sm mt-5">Join 12,000+ job seekers already using Applimatic</p>
        </div>
      </section>


      {/* ══ FOOTER ═══════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            {/* Logo + tagline */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                  <span className="text-white font-black text-sm">Ap</span>
                </div>
                <span className="text-white font-black text-xl">Appli<span className="text-brand">matic</span></span>
              </div>
              <p className="text-sm text-gray-500">applimatic.ai — Your experience, told perfectly.</p>
            </div>
            {/* Links */}
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            {/* Social */}
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand transition-colors" aria-label="Twitter">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand transition-colors" aria-label="LinkedIn">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-xs text-gray-600 text-center sm:text-left">
            © 2026 Applimatic. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  )
}
