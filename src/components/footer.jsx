import React from "react";
import { useNavigate } from "react-router-dom";
import "./footer.scss";
import logo from "../assets/logo1.jpg";


const FOOTER_LINKS = ["Features", "Modules", "How it Works", "Contact", ];

export default function Footer() {
  const navigate = useNavigate();
  const goToLogin = () => navigate("/login");

  return (
    <footer className="ft">
      <div className="ft__card">
        <div className="ft__grid" aria-hidden="true" />
        <span className="ft__glow ft__glow--gold" aria-hidden="true" />
        <span className="ft__glow ft__glow--blue" aria-hidden="true" />

        <div className="ft__inner">
          {/* ── Floating decorative elements ───────────────────── */}

          <div className="ft__float ft__float--chat-teacher" aria-hidden="true">
            <span className="ft__chat-avatar">KR</span>
            <div className="ft__chat-body">
              <strong>Mrs. Kavita Rao</strong>
              <span className="ft__chat-sub">Teacher</span>
              <p>Report cards sync instantly, love it</p>
            </div>
          </div>

          <div className="ft__float ft__float--id-card" aria-hidden="true">
            <div className="ft__id-tag">HELLO</div>
            <p className="ft__id-note">Hi, I'm Aarav from Class 6-B</p>
          </div>

          <div className="ft__float ft__float--ribbon" aria-hidden="true">
            <img src={logo} alt="MAGNET" className="ft__ribbon-logo" />
            MAGNET
          </div>

          <div className="ft__float ft__float--hexagon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="#0D1B2A" strokeWidth="1.8">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </div>

          <div className="ft__float ft__float--books" aria-hidden="true">
            <div className="ft__book ft__book--1" />
            <div className="ft__book ft__book--2" />
            <div className="ft__book ft__book--3" />
            <svg className="ft__glasses" viewBox="0 0 48 20" fill="none" stroke="#0D1B2A" strokeWidth="1.6">
              <circle cx="12" cy="10" r="8" />
              <circle cx="36" cy="10" r="8" />
              <path d="M20 10h8" />
              <path d="M4 8 0 6" />
              <path d="M44 8l4-2" />
            </svg>
          </div>

          <div className="ft__float ft__float--chat-parent" aria-hidden="true">
            <strong>Priya M. (Parent)</strong>
            <span className="ft__chat-sub">Inbox · 12:04 pm</span>
            <p>Fee paid, got the receipt right away. Love it.</p>
          </div>

          <div className="ft__float ft__float--badges" aria-hidden="true">
            <span className="ft__badge ft__badge--gold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </span>
            <span className="ft__badge ft__badge--blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </span>
          </div>

          <div className="ft__float ft__float--dot" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>

          <div className="ft__float ft__float--chat-staff" aria-hidden="true">
            <strong>Mr. Davies</strong>
            <span className="ft__chat-sub">Today, 4:12 pm</span>
            <p>Just got the attendance report. That was fast.</p>
          </div>

          <div className="ft__float ft__float--sticky" aria-hidden="true">
            <p>Remind Karthik's parent re: fee.</p>
            <p className="ft__sticky-strike">NVM, Paid!</p>
          </div>

          {/* ── Center CTA ──────────────────────────────────────── */}
          <div className="ft__center">
            <h2 className="ft__headline">Love your school, run it well.</h2>
            <p className="ft__sub">
              Attendance, fees, and report cards handled the same day — on the
              most flexible school platform around.
            </p>
            <button className="ft__btn" onClick={goToLogin}>
              Book your demo
            </button>
          </div>
        </div>

        {/* ── Bottom bar ──────────────────────────────────────── */}
        <div className="ft__bottom">
          <nav className="ft__links">
            {FOOTER_LINKS.map((l) => (
              <a href="#" key={l}>
                {l}
              </a>
            ))}
          </nav>

          <div className="ft__brand">
            <img src={logo} alt="MAGNET logo" className="ft__brand-logo" />
            MAGNET
          </div>

         
        </div>

        {/* ── Legal strip ─────────────────────────────────────── */}
        <div className="ft__legal">
          <span>© {new Date().getFullYear()} MAGNET. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}