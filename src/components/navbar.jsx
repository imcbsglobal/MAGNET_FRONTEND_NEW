import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./navbar.scss";
import logo from "../assets/logo1.jpg";

const NAV_LINKS = [
  { label: "Features",     href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Contact",      href: "#contact" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastY = React.useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y < 60 || y < lastY.current);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goToLogin = () => navigate("/login");

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMenuOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className={`fnav${visible ? "" : " fnav--hidden"}`}>

      {/* ── pill ── */}
      <div className="fnav__pill">

        <a href="/" className="fnav__logo" aria-label="MAGNET home">
          <img src={logo} alt="MAGNET" />
        </a>

       <nav className="fnav__links">
  {NAV_LINKS.map((l) => (
    <a
      key={l.label}
      href={l.href}
      className="fnav__link"
      onClick={(e) => handleNavClick(e, l.href)}
    >
      {l.label}
    </a>
  ))}
</nav>

        <button className="fnav__cta" onClick={goToLogin}>
          Login
        </button>

        {/* burger — mobile */}
        <button
          className={`fnav__burger${menuOpen ? " fnav__burger--open" : ""}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* ── mobile drawer ── */}
     {menuOpen && (
  <div className="fnav__drawer">
    {NAV_LINKS.map((l) => (
      <a
        key={l.label}
        href={l.href}
        className="fnav__drawer-link"
        onClick={(e) => handleNavClick(e, l.href)}
      >
        {l.label}
      </a>
    ))}
    <button
      className="fnav__drawer-cta"
      onClick={goToLogin}
    >
      Login
    </button>
  </div>
)}

    </header>
  );
}