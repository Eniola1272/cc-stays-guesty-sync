import React, { useState } from "react";

export const DEFAULT_EXACT_LINKS = {
  home: "/",
  stays: "/stays",
  destinations: "/destinations",
  experiences: "/experiences",
  about: "/about",
  journal: "/journal",
  contact: "/contact",
  partner: "https://partners.ccstays.com/",
  owners: "https://ccstays.guestyowners.com/",
  privacy: "/privacy-policy",
  terms: "/terms",
  accessibility: "/accessibility",
  instagram: "https://www.instagram.com/ccstays",
};

export const DEFAULT_EXACT_IMAGES = {
  logo: "https://ccstays.com/wp-content/uploads/2026/08/CC_Stays_logo.png",
  hero: "https://ccstays.com/wp-content/uploads/2026/03/ZDWUJy55RE2qNR5ucgho_MMVid111-v.mp4",
  propertyImages: {
    bamboo: [
      "https://ccstays.com/wp-content/uploads/2026/04/Bamboo-1-43.png",
      "https://ccstays.com/wp-content/uploads/2026/08/ccright.jpeg",
      "https://ccstays.com/wp-content/uploads/2026/07/71BBE3AA-BE2C-4D05-8E98-150181B7DC9F-2.jpg",
    ],
    hidden: [
      "https://ccstays.com/wp-content/uploads/2026/04/Isles-Villa-3.png",
      "https://ccstays.com/wp-content/uploads/2026/04/Isles-Villa-8.png",
      "https://ccstays.com/wp-content/uploads/2026/04/Isles-Villa-11.png",
    ],
    villa: [
      "https://ccstays.com/wp-content/uploads/2026/07/villa-ban-5.jpg",
      "https://ccstays.com/wp-content/uploads/2026/07/villa-ban-4.jpg",
      "https://ccstays.com/wp-content/uploads/2026/07/villa-ban-3.jpg",
    ],
    manatee: [
      "https://ccstays.com/wp-content/uploads/2026/04/Manatee-1-40.png",
      "https://ccstays.com/wp-content/uploads/2026/04/Casa-Palma-1-31.png",
      "https://ccstays.com/wp-content/uploads/2026/04/Casa-Palma-1-6.png",
    ],
  },
  storyOne: "https://ccstays.com/wp-content/uploads/2026/08/ccright.jpeg",
  storyTwo: "https://ccstays.com/wp-content/uploads/2026/04/Casa-Palma-1-31.png",
  storyInset: "https://ccstays.com/wp-content/uploads/2026/07/71BBE3AA-BE2C-4D05-8E98-150181B7DC9F-2.jpg",
  storyThree: "https://ccstays.com/wp-content/uploads/2026/07/9.jpg",
  journalOne: "https://ccstays.com/wp-content/uploads/2026/04/Bamboo-1-43.png",
  journalTwo: "https://ccstays.com/wp-content/uploads/2026/04/Isles-Villa-8.png",
  journalThree: "https://ccstays.com/wp-content/uploads/2026/07/villa-ban-5.jpg",
};

export const isVideoSource = (src) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(String(src || ""));

export const CcMono = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 460.33 460.33" aria-hidden="true">
    <path d="M354.66,304.51c21.89-.15,42.7-7.56,56.13-21.08v-6.35c-12.63,16.1-32.99,22.89-56.14,22.89-35.22,0-64.26-34.04-65.07-69.11-.8-34.41,22.78-69.86,65.07-70.54,30.07-.49,50.51,13.23,56.14,31.57v-19.04c-13.95-12.2-34.84-17.03-56.14-17.03-55.12,0-81.78,36.97-81.6,73.97.18,37.52,27.94,75.1,81.61,74.71Z" />
    <path d="M187.28,283.43v-6.35c-12.63,16.1-32.99,22.89-56.14,22.89-35.22,0-64.26-34.04-65.07-69.11-.8-34.41,22.78-69.86,65.07-70.54,30.07-.49,50.51,13.23,56.14,31.57v-19.04c-13.95-12.2-34.84-17.03-56.14-17.03-55.12,0-81.78,36.97-81.6,73.97.18,37.52,27.94,75.1,81.61,74.71,21.89-.15,42.7-7.56,56.13-21.08Z" />
    <path d="M230.17,460.33c127.12,0,230.17-103.05,230.17-230.17S357.28,0,230.17,0,0,103.05,0,230.17s103.05,230.17,230.17,230.17ZM6.88,236.09C3.78,110.09,104.2,22.46,225.81,20.58c120.4-1.86,223.48,79.19,227.72,202.49,2.9,84.3-43.16,159.37-120.93,194.77-69.16,31.49-149.87,29.26-216.19-5.65C49.74,377.08,8.73,311,6.88,236.09Z" />
    <rect x="227.11" y="138.6" width="6.1" height="183.13" />
  </svg>
);

export const CcFull = ({ className = "" }) => (
  <span className={`cc-exact-full-logo ${className}`}>
    <CcMono />
    <span>STAYS</span>
  </span>
);

export const CcWatermark = ({ className = "" }) => <CcMono className={`cc-exact-watermark ${className}`} />;

export const ExactHeader = ({ links = DEFAULT_EXACT_LINKS, solid = true }) => {
  const [open, setOpen] = useState(false);
  const nav = [
    ["Stays", links.stays],
    ["About Us", links.about],
    ["Contact", links.contact],
    ["Partner With Us ↗", links.partner],
    ["Owners ↗", links.owners],
  ];

  return (
    <>
      <header className={`cc-exact-nav ${solid ? "solid" : "clear"}`}>
        <div className="cc-exact-nav-inner">
          <a className="cc-exact-brand" href={links.home} aria-label="CC Stays home">
            <CcMono />
            <span>CC&nbsp;Stays</span>
          </a>
          <nav className="cc-exact-nav-links" aria-label="Primary">
            {nav.map(([label, href]) => <a href={href} key={label}>{label}</a>)}
          </nav>
          <button type="button" className="cc-exact-menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 7h18M3 12h18M3 17h18" /></svg>
          </button>
        </div>
      </header>
      <div className={`cc-exact-drawer ${open ? "open" : ""}`}>
        <div className="cc-exact-drawer-top">
          <a className="cc-exact-brand" href={links.home} onClick={() => setOpen(false)} aria-label="CC Stays home">
            <CcMono />
            <span>CC&nbsp;Stays</span>
          </a>
          <button type="button" className="cc-exact-menu-btn" aria-label="Close menu" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
        </div>
        <nav className="cc-exact-drawer-links" aria-label="Menu">
          {nav.map(([label, href]) => <a href={href} key={label} onClick={() => setOpen(false)}>{label}</a>)}
        </nav>
        <a className="cc-exact-btn cc-exact-btn-primary cc-exact-drawer-cta" href={links.stays} onClick={() => setOpen(false)}>Find a Stay</a>
      </div>
    </>
  );
};

export const ExactFooter = ({ links = DEFAULT_EXACT_LINKS }) => (
  <footer className="cc-exact-footer">
    <div className="cc-exact-wrap cc-exact-foot-top">
      <div className="cc-exact-foot-logo">
        <CcFull />
        <p>Stay somewhere you&apos;ll remember.</p>
      </div>
      <nav>
        <h5>Stay</h5>
        <a href={links.stays}>All Stays</a>
        <a href={links.destinations}>Destinations</a>
        <a href={links.experiences}>Experiences</a>
      </nav>
      <nav>
        <h5>CC Stays</h5>
        <a href={links.about}>About Us</a>
        <a href={links.journal}>The Journal</a>
        <a href={links.contact}>Contact</a>
      </nav>
      <nav>
        <h5>Partners</h5>
        <a href={links.partner}>Partner With Us ↗</a>
        <a className="cc-revamp-fade" href={links.owners}>Owners ↗</a>
      </nav>
      <nav>
        <h5>Follow</h5>
        <a href={links.instagram}>Instagram</a>
      </nav>
    </div>
    <div className="cc-exact-wrap cc-exact-foot-bottom">
      <span>© 2026 CC Stays. All rights reserved.</span>
      <span><a href={links.privacy}>Privacy</a><a href={links.terms}>Terms</a><a href={links.accessibility}>Accessibility</a></span>
    </div>
  </footer>
);

export const ExactMedia = ({ src, className = "", priority = false }) => {
  if (!src) return null;
  return (
    <div className={`cc-exact-media ${className}`}>
      {isVideoSource(src) ? (
        <video src={src} autoPlay muted loop playsInline preload={priority ? "auto" : "metadata"} />
      ) : (
        <img src={src} alt="" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} />
      )}
    </div>
  );
};

export const ExactKick = ({ children, center = false }) => (
  <div className="cc-exact-eyebrow" style={center ? { justifyContent: "center" } : undefined}>{children}</div>
);
