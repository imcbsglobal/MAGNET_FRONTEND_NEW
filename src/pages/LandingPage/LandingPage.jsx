import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.scss";
import bannerImg from "../../assets/banner.png";
import heroVideo from "../../assets/video.mp4";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";

const STEPS = [
  {
    num: "01",
    title: "Add your school",
    desc: "Import students, staff, and classes in one go — from a spreadsheet, or start fresh with the guided setup wizard.",
    bullets: [
      "Bulk import from Excel or Google Sheets in minutes",
      "Guided setup wizard available in 8 Indian languages",
    ],
  },
  {
    num: "02",
    title: "Invite your team",
    desc: "Send one link to teachers and parents — everyone gets the right access automatically, with no manual role setup.",
    bullets: [
      "Role-based access for admins, teachers, and parents",
      "Automatic reminders sent to anyone yet to join",
    ],
  },
  {
    num: "03",
    title: "Go live",
    desc: "Start taking attendance, collecting fees, and messaging parents the same day — there's no separate rollout phase.",
    bullets: [
      "Same-day onboarding with a dedicated setup specialist",
      "Existing records migrate over, nothing starts from zero",
    ],
  },
];

const TESTIMONIALS = [
  {
    quote:
      "MAGNET replaced four separate tools. Our admin team saves hours every single week — and parents actually get replies now.",
    name: "Priya Nair",
    role: "Principal, Greenfield Academy",
    initials: "PN",
    stat: "4 tools replaced",
  },
  {
    quote:
      "The fee management module alone was worth it. Overdue collections dropped by 60% in the first term.",
    name: "Rajesh Kumar",
    role: "Finance Head, Lotus International School",
    initials: "RK",
    stat: "60% drop in overdue",
  },
  {
    quote:
      "ID card generation used to take two days. Now we do it in under an hour for 800 students.",
    name: "Sunita Menon",
    role: "Administrative Officer, Bright Horizons",
    initials: "SM",
    stat: "800 cards in 1 hour",
  },
];

const FEED_ITEMS = [
  { icon: "check", color: "green", text: "Attendance marked", sub: "Class 8B · 42 students" },
  { icon: "rupee", color: "gold", text: "Fee payment received", sub: "₹3,200 · Aryan R." },
  { icon: "id", color: "blue", text: "ID card generated", sub: "Priya S. · Class 6A" },
  { icon: "msg", color: "navy", text: "Message sent to parents", sub: "128 recipients" },
  { icon: "check", color: "green", text: "Attendance marked", sub: "Class 10C · 38 students" },
  { icon: "rupee", color: "gold", text: "Fee payment received", sub: "₹1,800 · Sunita M." },
  { icon: "id", color: "blue", text: "ID card generated", sub: "Rahul K. · Class 9A" },
  { icon: "msg", color: "navy", text: "Reminder sent", sub: "32 pending dues" },
];

function formatProgress(value, progress) {
  const match = String(value).match(/^([^\d]*)([\d.]+)(.*)$/);
  if (!match) return value;
  const [, prefix, numStr, suffix] = match;
  const target = parseFloat(numStr);
  const decimals = (numStr.split(".")[1] || "").length;
  const current = (target * progress).toFixed(decimals);
  return `${prefix}${current}${suffix}`;
}

function AnimatedNumber({ value, duration = 1300 }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(formatProgress(value, 0));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { setDisplay(formatProgress(value, 1)); return; }
    let frame;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(formatProgress(value, eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      observer.disconnect();
    }, { threshold: 0.4 });
    observer.observe(el);
    return () => { observer.disconnect(); if (frame) cancelAnimationFrame(frame); };
  }, [value, duration]);

  return <span ref={ref}>{display}</span>;
}

function SquiggleToPencil() {
  return (
    <svg
      className="lp-sketch__svg"
      viewBox="0 0 1100 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="A hand-drawn squiggly line trailing off from a pencil"
    >
      <path
        className="lp-sketch__line"
        d="M40,160
           C70,110 90,110 110,150
           C125,180 100,195 80,185
           C65,178 70,160 90,160
           C130,160 150,90 190,95
           C220,99 215,170 245,170
           C275,170 270,100 300,100
           C330,100 325,170 355,170
           C385,170 380,110 410,110
           C440,110 430,170 470,170
           C510,170 505,115 540,115
           C570,115 565,170 600,170
           C635,170 630,120 665,125
           C700,130 690,170 720,170
           C760,170 755,115 800,120
           C840,124 845,170 870,168"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <g className="lp-sketch__sparks" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M148,85 L154,95 M158,82 L150,90" />
        <path d="M330,108 L324,98 M320,110 L332,102" />
      </g>
      <circle className="lp-sketch__sparks" cx="455" cy="92" r="2.5" fill="currentColor" />
      <circle className="lp-sketch__sparks" cx="615" cy="100" r="2" fill="currentColor" />
      <g transform="translate(862,172) rotate(-34)">
        <rect x="0" y="-11" width="115" height="22" fill="#F4C430" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <line x1="0" y1="-11" x2="0" y2="11" stroke="currentColor" strokeWidth="2.2" />
        <line x1="93" y1="-11" x2="93" y2="11" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
        <polygon points="115,-11 148,0 115,11" fill="#E8C25A" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <polygon points="138,-4 148,0 138,4" fill="#2B2B2B" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <polygon points="146,-1 152,0 146,1" fill="currentColor" />
      </g>
    </svg>
  );
}

function Sparkline({ color = "#F59E0B", up = true }) {
  const points = up
    ? "0,28 12,24 24,22 36,18 48,16 60,12 72,10 84,8 96,6 108,4"
    : "0,6 12,10 24,14 36,16 48,18 60,22 72,20 68,24 84,20 108,22";
  return (
    <svg viewBox="0 0 108 32" fill="none" className="lp-stat-sparkline">
      <polyline points={points} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeedIcon({ type }) {
  switch (type) {
    case "check":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "rupee":
      return <span className="lp-feed__rupee">₹</span>;
    case "id":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <circle cx="8" cy="12" r="2" />
          <path d="M13 10h5M13 14h3" strokeLinecap="round" />
        </svg>
      );
    case "msg":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

function LiveActivityFeed() {
  const loopItems = [...FEED_ITEMS, ...FEED_ITEMS];
  return (
    <div className="lp-feed">
      <div className="lp-feed__track">
        {loopItems.map((item, i) => (
          <div className="lp-feed__row" key={i}>
            <span className={`lp-feed__icon lp-feed__icon--${item.color}`}>
              <FeedIcon type={item.icon} />
            </span>
            <span className="lp-feed__text">
              <strong>{item.text}</strong>
              <small>{item.sub}</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [activeSidebarItem, setActiveSidebarItem] = useState("Dashboard");
  const heroRef = useRef(null);

  useEffect(() => {
    const els = document.querySelectorAll(".lp-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("lp-reveal--visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const goToLogin = () => navigate("/login");

  const handleNavClick = (e, href) => {
    e.preventDefault();
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const sidebarFeatureItems = [
    { label: "Dashboard", icon: (
      <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>
    )},
    { label: "Attendance", icon: (
      <svg viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg>
    )},
    { label: "Fee Management", icon: (
      <svg viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
    )},
    { label: "ID Cards", icon: (
      <svg viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M13 10h5M13 14h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    )},
    { label: "Communication", icon: (
      <svg viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
    )},
    { label: "Reports", icon: (
      <svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.5"/></svg>
    )},
  ];

  const sidebarDocItems = [
    { label: "School Settings" },
    { label: "Academic Year" },
    { label: "→ More" },
  ];

  const statCards = [
    { label: "Fees Collected", change: "↑ 12.4%", changeUp: true, value: "₹6,84,500", sub: "View fee report ↗", sub2: "Last 6 months overview", sparkColor: "#10B981", up: true },
    { label: "Pending Dues", change: "↓ 8.2%", changeUp: false, value: "₹1,12,000", sub: "Review pending fees ↗", sub2: "Waiting to be cleared", sparkColor: "#EF4444", up: false },
    { label: "Students Active", change: "↑ 3%", changeUp: true, value: "1,248", sub: "View students ↗", sub2: "Enrolled this term", sparkColor: "#3B82F6", up: true },
    { label: "Attendance Rate", change: "↑ 1.8%", changeUp: true, value: "91.4%", sub: "View analytics ↗", sub2: "Monthly avg performance", sparkColor: "#F59E0B", up: true },
  ];

  return (
    <div className="lp">
      <Navbar />

      {/* HERO VIDEO SECTION */}
<section className="hero-video">
  <video
    className="hero-video__bg"
    autoPlay
    muted
    loop
    playsInline
  >
    <source src={heroVideo} type="video/mp4" />
  </video>

  <div className="hero-video__overlay"></div>

  <div className="hero-video__content">
    <span className="hero-video__badge">
      🚀 Smart School Management Platform
    </span>

    <h1>
      Run Your Entire
      <span> School Digitally</span>
    </h1>

    <p>
      Attendance, Fees, Communication, ID Cards, Reports,
      Academics and Administration — all from one powerful platform.
    </p>

    <div className="hero-video__buttons">
      <button
        className="hero-video__primary"
        onClick={goToLogin}
      >
        Get Started
      </button>

      <a
        href="#modules"
        className="hero-video__secondary"
        onClick={(e) => handleNavClick(e, "#modules")}
      >
        Explore Features
      </a>
    </div>

    <div className="hero-video__stats">
      

      

    </div>
  </div>

 
</section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="lp-how" id="how-it-works">
        <div className="lp-container">
          <div className="lp-how__layout">
            <div className="lp-how__col">
              <div className="lp-how__head lp-reveal">
                <span className="lp-eyebrow lp-eyebrow--bracket">[ How it works ]</span>
                <h2 className="lp-section-title">
                  Three steps from sign-up to your first day live.
                </h2>
              </div>

              <div className="lp-how__list lp-reveal">
                {STEPS.map((step, i) => {
                  const active = i === activeStep;
                  return (
                    <div className={`lp-how__item${active ? " lp-how__item--active" : ""}`} key={step.num}>
                      <button type="button" className="lp-how__row" onClick={() => setActiveStep(i)} aria-expanded={active}>
                        <span className="lp-how__num">{step.num}</span>
                        <span className="lp-how__title">{step.title}</span>
                        <span className="lp-how__toggle" aria-hidden="true">{active ? "–" : "+"}</span>
                      </button>
                      <div className="lp-how__panel">
                        <div className="lp-how__panel-inner">
                          <p className="lp-how__desc">{step.desc}</p>
                          <ul className="lp-how__bullets">
                            {step.bullets.map((b) => (
                              <li key={b}>
                                <span className="lp-how__bullet-icon" aria-hidden="true">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 12a9 9 0 1 0 3-6.7" />
                                    <path d="M3 4v5h5" />
                                  </svg>
                                </span>
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lp-how__visual lp-reveal">
              <div className="lp-dashboard-mock">
                <div className="lp-window-bar">
                  <span className="lp-window-dots">
                    <span /><span /><span />
                  </span>
                  <span className="lp-window-url">app.magnet.school/setup</span>
                  <span className="lp-window-badge">
                    <span className="lp-window-live-dot" />
                    LIVE
                  </span>
                </div>

                <div className="lp-dashboard-mock__body">

                <div className="lp-dm-meta">
                  <div className="lp-dm-meta__col">
                    <span className="lp-dm-meta__label">Step</span>
                    <span className="lp-dm-meta__value">{STEPS[activeStep].num} of 0{STEPS.length}</span>
                  </div>
                  <div className="lp-dm-meta__col lp-dm-meta__col--right">
                    <span className="lp-dm-meta__label">Status</span>
                    <span className="lp-dm-meta__value">{activeStep === STEPS.length - 1 ? "Ready to launch" : "In progress"}</span>
                  </div>
                </div>

                <div className="lp-dm-progress">
                  <div className="lp-dm-progress__bar" style={{ "--p": `${((activeStep + 1) / STEPS.length) * 100}%` }} />
                </div>

                <span className="lp-dm-section-label">Setup checklist</span>

                <div className="lp-dm-steps">
                  {STEPS.map((step, i) => {
                    const state = i < activeStep ? "done" : i === activeStep ? "active" : "pending";
                    return (
                      <div className="lp-dm-steps__row" key={step.num}>
                        <span className={`lp-dm-steps__status lp-dm-steps__status--${state}`}>{state === "done" ? "✓" : ""}</span>
                        <span className="lp-dm-steps__label">{step.title}</span>
                      </div>
                    );
                  })}
                </div>

                <span className="lp-dm-section-label">Estimated setup time</span>

                <div className="lp-dm-total">
                  <span className="lp-dm-total__name">{activeStep === STEPS.length - 1 ? "You're live" : "Remaining"}</span>
                  <span className="lp-dm-total__value">{["15 min", "8 min", "0 min"][activeStep]}</span>
                </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SYNC — DARK DASHBOARD MOCK ─────────────────────────── */}
      <section className="lp-sync" id="sync">
        <div className="lp-container">
          <div className="lp-sync__head lp-reveal">
            <span className="lp-eyebrow lp-eyebrow--bracket lp-eyebrow--on-dark">
              [ Real-time sync ]
            </span>
            <h2 className="lp-sync__headline">
              One update.
              <br />
              <em>Every screen.</em> Instantly.
            </h2>
            <p className="lp-sync__sub">
              Mark attendance on a teacher's phone and parents see it within
              seconds. Record a fee payment and the admin dashboard updates
              immediately — no exports, no refreshing, nobody waiting on anyone.
            </p>
          </div>

          <div className="lp-sync__stage lp-reveal">
            <div className="lp-dash">
              <aside className="lp-dash__sidebar">
                <div className="lp-dash__brand">
                  <span className="lp-dash__brand-dot" />
                  MAGNET
                </div>

                <button className="lp-dash__add-btn">+ Add new</button>

                <span className="lp-dash__nav-group-label">FEATURE</span>
                <nav className="lp-dash__nav">
                  {sidebarFeatureItems.map((item) => (
                    <button
                      key={item.label}
                      className={`lp-dash__nav-item${activeSidebarItem === item.label ? " lp-dash__nav-item--active" : ""}`}
                      onClick={() => setActiveSidebarItem(item.label)}
                    >
                      <span className="lp-dash__nav-icon">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </nav>

                <span className="lp-dash__nav-group-label">DOCUMENTS</span>
                <nav className="lp-dash__nav">
                  {sidebarDocItems.map((item) => (
                    <button key={item.label} className="lp-dash__nav-item lp-dash__nav-item--doc">
                      <span className="lp-dash__nav-icon">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8"/></svg>
                      </span>
                      {item.label}
                    </button>
                  ))}
                </nav>

                <div className="lp-dash__user">
                  <span className="lp-dash__user-avatar">AD</span>
                  <div className="lp-dash__user-info">
                    <strong>Admin</strong>
                    <span>admin@magnet.school</span>
                  </div>
                </div>
              </aside>

              <div className="lp-dash__main">
                <div className="lp-dash__topbar">
                  <h1 className="lp-dash__page-title">Dashboard</h1>
                  <button className="lp-dash__quick-btn">
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
                    Quick actions
                  </button>
                </div>

                <div className="lp-dash__stats">
                  {statCards.map((card) => (
                    <div className="lp-dash__stat-card" key={card.label}>
                      <div className="lp-dash__stat-top">
                        <span className="lp-dash__stat-label">{card.label}</span>
                        <span className={`lp-dash__stat-change lp-dash__stat-change--${card.changeUp ? "up" : "down"}`}>{card.change}</span>
                      </div>
                      <div className="lp-dash__stat-value">{card.value}</div>
                      <Sparkline color={card.sparkColor} up={card.up} />
                      <div className="lp-dash__stat-sub">{card.sub}</div>
                      <div className="lp-dash__stat-sub2">{card.sub2}</div>
                    </div>
                  ))}
                </div>

                <div className="lp-dash__chart-card">
                  <div className="lp-dash__chart-header">
                    <div>
                      <span className="lp-dash__chart-title">Fee Collections</span>
                      <span className="lp-dash__chart-subtitle">Total for the last 6 months</span>
                    </div>
                    <div className="lp-dash__chart-tabs">
                      <button className="lp-dash__chart-tab lp-dash__chart-tab--active">Last 6 Months</button>
                      <button className="lp-dash__chart-tab">Last 30 Days</button>
                      <button className="lp-dash__chart-tab">Last 7 Days</button>
                    </div>
                  </div>
                  <div className="lp-dash__chart">
                    <svg viewBox="0 0 940 160" preserveAspectRatio="none" className="lp-dash__chart-svg">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      {[20, 60, 100, 140].map((y) => (
                        <line key={y} x1="0" y1={y} x2="940" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      ))}
                      <path
                        d="M60,140 C160,135 200,128 280,118 C360,108 400,98 460,80 C520,62 580,50 640,40 C700,30 760,24 840,18 C880,15 910,14 940,13 L940,160 L60,160 Z"
                        fill="url(#chartGrad)"
                      />
                      <path
                        d="M60,140 C160,135 200,128 280,118 C360,108 400,98 460,80 C520,62 580,50 640,40 C700,30 760,24 840,18 C880,15 910,14 940,13"
                        stroke="#94A3B8"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <circle cx="940" cy="13" r="4" fill="#F59E0B" />
                    </svg>
                    <div className="lp-dash__chart-labels">
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m) => (
                        <span key={m}>{m}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODULES INTRO ─────────────────────────────────────── */}
      <section className="lp-sketch" id="modules">
        <div className="lp-container">
          <div className="lp-sketch__inner lp-reveal">
            <h2 className="lp-sketch__headline">
              Schools do not need more
              <br />
              <span className="lp-sketch__strike">
                more software
                <svg className="lp-sketch__strike-mark" viewBox="0 0 300 40" fill="none" aria-hidden="true">
                  <path d="M6,21 C70,13 160,27 292,17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
              . They need <span className="lp-sketch__highlight">one system.</span>
            </h2>

            <div className="lp-sketch__copy">
              <p>
                Today, a school's day runs across disconnected apps. One tool
                takes attendance. Another tracks fees. A third handles ID
                cards. Someone stitches it all together by hand, and leaders
                only see the full picture once it's too late to act on it.
              </p>
              <p>
                MAGNET replaces the stitching. Every module shares the same
                students, the same records, the same moment in time — so
                attendance, fees, and communication finally talk to each
                other, automatically.
              </p>
            </div>
          </div>

          <div className="lp-sketch__drawing lp-reveal" aria-hidden="true">
            <SquiggleToPencil />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="lp-testimonials" id="testimonials">
        <div className="lp-container">
          <div className="lp-section-header lp-reveal">
            <span className="lp-eyebrow lp-eyebrow--dark">What Schools Say</span>
            <h2 className="lp-section-title">Real results, real schools</h2>
            <p className="lp-section-desc">
              Trusted by 300+ schools across India — here's what their teams say.
            </p>
          </div>

          <div className="lp-tcard-grid lp-reveal">
            {TESTIMONIALS.map((t, i) => (
              <div className="lp-tcard" key={i}>
                <div className="lp-tcard__top">
                  <span className="lp-tcard__quote-mark" aria-hidden="true">"</span>
                  <span className="lp-tcard__stat">{t.stat}</span>
                </div>
                <p className="lp-tcard__body">"{t.quote}"</p>
                <div className="lp-tcard__author">
                  <span className="lp-tcard__avatar">{t.initials}</span>
                  <span className="lp-tcard__meta">
                    <strong>{t.name}</strong>
                    <em>{t.role}</em>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="lp-cta" id="contact">
        <div className="lp-container">
          <div className="lp-cta__inner lp-reveal">
            <span className="lp-eyebrow">Get Started Today</span>
            <h2 className="lp-cta__headline">
              Ready to bring your school
              <br />
              into focus?
            </h2>
            <p className="lp-cta__sub">
              Join 100+ schools already running on MAGNET.
              <br />
              No long contracts. Free onboarding. Results from week one.
            </p>
            <div className="lp-cta__form">
              <input type="email" placeholder="Your school email address" className="lp-cta__input" aria-label="School email" />
              <button className="lp-btn lp-btn--primary lp-btn--lg" onClick={goToLogin}>Request Demo</button>
            </div>
            <p className="lp-cta__note">No credit card required · Setup in under 24 hours</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}