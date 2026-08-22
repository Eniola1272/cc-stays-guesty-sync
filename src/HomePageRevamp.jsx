import React, { useEffect, useMemo, useRef, useState } from "react";
import "./HomePageRevamp.css";

const DEFAULT_LINKS = {
  home: "/",
  stays: "/stays",
  destinations: "/destinations",
  experiences: "/experiences",
  about: "/about",
  journal: "/journal",
  contact: "/contact",
  owners: "https://ccstays.guestyowners.com/",
  partner: "https://partners.ccstays.com/",
  privacy: "/privacy-policy",
  terms: "/terms",
  accessibility: "/accessibility",
  instagram: "https://www.instagram.com/ccstays",
};

const FEATURED_CONFIG = [
  {
    key: "bamboo",
    title: "Bamboo Bliss",
    city: "Fort Lauderdale, Florida",
    guests: 8,
    bedrooms: 4,
    bathrooms: 4,
    price: 485,
    rating: "4.99",
    aliases: ["bamboo bliss", "bamboo"],
  },
  {
    key: "hidden",
    title: "Hidden Waters",
    city: "Blue Ridge, Georgia",
    guests: 8,
    bedrooms: 3,
    bathrooms: 2,
    price: 420,
    rating: "4.97",
    aliases: ["hidden waters", "blue ridge"],
  },
  {
    key: "villa",
    title: "Villa Banana",
    city: "Wilton Manors, Florida",
    guests: 6,
    bedrooms: 3,
    bathrooms: 2,
    price: 365,
    badge: "New to CC Stays",
    aliases: ["villa banana", "banana"],
  },
  {
    key: "manatee",
    title: "Manatee Manors",
    city: "Wilton Manors, Florida",
    guests: 8,
    bedrooms: 3,
    bathrooms: 2,
    price: 395,
    aliases: ["manatee manors", "manatee"],
  },
];

const REVIEWS = [
  {
    property: "Bamboo Bliss",
    quote: "The heated pool and backyard felt like our own private resort.",
    meta: "Bamboo Bliss · 2026",
  },
  {
    property: "Hidden Waters",
    quote: "This place in one phrase: breathtaking.",
    meta: "Hidden Waters · 2026",
  },
  {
    property: "Villa Banana",
    quote: "Divine. Everything from the beds to the pool to the patio. They truly thought of everything.",
    meta: "Villa Banana · 2026",
  },
  {
    property: "Manatee Manors",
    quote: "Our best and favorite rental so far.",
    meta: "Manatee Manors · 2026",
  },
];

const STANDARD_ITEMS = [
  ["sparkle", "Handpicked by us", "Every residence is chosen for its design, comfort, location, and the way it actually feels to stay there."],
  ["key", "Ready when you arrive", "Smart locks, smooth check-in, and a home prepared so you can settle in right away."],
  ["waves", "Amenities that work and play", "Pools, fast Wi-Fi, kitchens, workspaces, outdoor areas, and the extras that make the home part of the trip."],
  ["moon", "Sleep well", "Comfortable beds, quality bedding, and the essentials that make it easy to actually relax."],
  ["drop", "Just bring your toothbrush", "Bath essentials, fresh towels, and the everyday basics already waiting for you."],
  ["bell", "Concierge, when you want it", "White-glove help throughout your stay."],
];

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const firstPresent = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

const syncedNumber = (value, fallback, fallbackSentinel = null) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  if (fallbackSentinel !== null && number === fallbackSentinel && fallback !== fallbackSentinel) return fallback;
  return number;
};

const uniqueImages = (...groups) => {
  const seen = new Set();
  return groups
    .flat()
    .filter(Boolean)
    .filter((src) => {
      if (seen.has(src)) return false;
      seen.add(src);
      return true;
    });
};

const CcWatermark = () => (
  <svg className="cc-revamp-watermark" viewBox="0 0 460.33 460.33" aria-hidden="true">
    <path d="M354.66,304.51c21.89-.15,42.7-7.56,56.13-21.08h0v-6.35c-12.63,16.1-32.99,22.89-56.14,22.89-35.22,0-64.26-34.04-65.07-69.11-.8-34.41,22.78-69.86,65.07-70.54,30.07-.49,50.51,13.23,56.14,31.57v-19.04c-13.95-12.2-34.84-17.03-56.14-17.03-55.12,0-81.78,36.97-81.6,73.97.18,37.52,27.94,75.1,81.61,74.71Z" />
    <path d="M187.28,283.43h0v-6.35c-12.63,16.1-32.99,22.89-56.14,22.89-35.22,0-64.26-34.04-65.07-69.11-.8-34.41,22.78-69.86,65.07-70.54,30.07-.49,50.51,13.23,56.14,31.57v-19.04c-13.95-12.2-34.84-17.03-56.14-17.03-55.12,0-81.78,36.97-81.6,73.97.18,37.52,27.94,75.1,81.61,74.71,21.89-.15,42.7-7.56,56.13-21.08Z" />
    <path d="M230.17,460.33c127.12,0,230.17-103.05,230.17-230.17S357.28,0,230.17,0,0,103.05,0,230.17s103.05,230.17,230.17,230.17ZM6.88,236.09C3.78,110.09,104.2,22.46,225.81,20.58c120.4-1.86,223.48,79.19,227.72,202.49,2.9,84.3-43.16,159.37-120.93,194.77-69.16,31.49-149.87,29.26-216.19-5.65C49.74,377.08,8.73,311,6.88,236.09Z" />
    <rect x="227.11" y="138.6" width="6.1" height="183.13" />
  </svg>
);

const LogoMark = ({ logo, compact = false }) => (
  <span className={`cc-revamp-brand ${compact ? "cc-revamp-brand--compact" : ""}`}>
    {logo ? <img src={logo} alt="CC Stays" /> : null}
    {/* {!compact && <span>CC Stays</span>}  */}
  </span>
);

const isVideoSource = (src) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(String(src || ""));

const ImagePanel = ({ property, image, ratio = "21 / 9", priority = false }) => {
  const sources = useMemo(
    () => uniqueImages(image, property?.image, property?.images || []),
    [image, property?.image, property?.images],
  );
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [sources]);

  const currentSource = sources[sourceIndex];
  const handleError = () => setSourceIndex((index) => index + 1);

  return (
    <div className="cc-revamp-hero-media" style={{ aspectRatio: ratio }}>
      {currentSource && isVideoSource(currentSource) ? (
        <video
          src={currentSource}
          autoPlay
          muted
          loop
          playsInline
          preload={priority ? "auto" : "metadata"}
          onError={handleError}
        />
      ) : currentSource ? (
        <img
          src={currentSource}
          alt=""
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          onError={handleError}
        />
      ) : null}
    </div>
  );
};

const Icon = ({ name }) => {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.45,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    sparkle: (
      <>
        <path d="M12 3.5 14.1 9l5.4 2-5.4 2L12 18.5 9.9 13l-5.4-2 5.4-2L12 3.5Z" />
        <path d="M18 4v3" />
        <path d="M19.5 5.5h-3" />
      </>
    ),
    key: (
      <>
        <circle cx="8" cy="15" r="3" />
        <path d="m10.2 12.8 7-7" />
        <path d="m15.5 7.5 2 2" />
        <path d="m13.7 9.3 2 2" />
      </>
    ),
    waves: (
      <>
        <path d="M3 8c2.2 0 2.2 1.7 4.4 1.7S9.6 8 11.8 8s2.2 1.7 4.4 1.7S18.4 8 21 8" />
        <path d="M3 13c2.2 0 2.2 1.7 4.4 1.7s2.2-1.7 4.4-1.7 2.2 1.7 4.4 1.7S18.4 13 21 13" />
      </>
    ),
    moon: <path d="M19 14.8A7.4 7.4 0 0 1 9.2 5a7.7 7.7 0 1 0 9.8 9.8Z" />,
    drop: <path d="M12 3.5s6 6.2 6 10.6a6 6 0 1 1-12 0c0-4.4 6-10.6 6-10.6Z" />,
    bell: (
      <>
        <path d="M6.8 10.5a5.2 5.2 0 0 1 10.4 0c0 5 2 5.8 2 5.8H4.8s2-.8 2-5.8Z" />
        <path d="M10 19a2.2 2.2 0 0 0 4 0" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
};

const useProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/wp-json/cc-stays/v1/search-stays")
      .then((response) => response.json())
      .then((data) => {
        setProperties(Array.isArray(data) ? data : []);
      })
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  return { properties, loading };
};

const matchProperty = (properties, config) => {
  const aliases = [config.title, ...(config.aliases || [])].map(normalize).filter(Boolean);
  return (
    properties.find((property) => aliases.includes(normalize(property.title))) ||
    properties.find((property) => aliases.some((alias) => normalize(property.title).includes(alias))) ||
    properties.find((property) => aliases.some((alias) => alias.includes(normalize(property.title))))
  );
};

const buildQuery = ({ checkIn, checkOut, guests }) => {
  const params = new URLSearchParams();
  if (checkIn) params.set("checkIn", checkIn);
  if (checkOut) params.set("checkOut", checkOut);
  if (guests > 0) params.set("guests", String(guests));
  return params.toString();
};

const HomeSearch = ({ properties, featured, links }) => {
  const [selectedKey, setSelectedKey] = useState("any");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [isGuestOpen, setGuestOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setGuestOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const query = buildQuery({ checkIn, checkOut, guests });
    const selected =
      selectedKey === "any"
        ? null
        : featured.find((property) => property.key === selectedKey) ||
          properties.find((property) =>
            [property.id, property.url, property.title].map(String).includes(selectedKey),
          );
    const destination = selected?.url || links.stays;
    window.location.href = `${destination}${query ? `?${query}` : ""}`;
  };

  return (
    <form className="cc-revamp-search" ref={searchRef} onSubmit={handleSubmit}>
      <label className="cc-revamp-search-field cc-revamp-search-field--stay">
        <span>Stay</span>
        <select value={selectedKey} onChange={(event) => setSelectedKey(event.target.value)}>
          <option value="any">Any CC Stay</option>
          {featured.map((property) => (
            <option key={property.key} value={property.key}>
              {property.title}
            </option>
          ))}
          {properties
            .filter((property) => !featured.some((item) => item.id === property.id))
            .map((property) => (
              <option key={property.id || property.url || property.title} value={property.id || property.url || property.title}>
                {property.title}
              </option>
            ))}
        </select>
      </label>
      <label className="cc-revamp-search-field">
        <span>Check In</span>
        <input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
      </label>
      <label className="cc-revamp-search-field">
        <span>Check Out</span>
        <input type="date" value={checkOut} min={checkIn || undefined} onChange={(event) => setCheckOut(event.target.value)} />
      </label>
      <div className="cc-revamp-search-field cc-revamp-search-field--who">
        <button type="button" onClick={() => setGuestOpen((open) => !open)}>
          <span>Who</span>
          <strong>{guests} guest{guests === 1 ? "" : "s"}</strong>
        </button>
        {isGuestOpen && (
          <div className="cc-revamp-guest-pop">
            <div>
              <strong>Guests</strong>
              <p>Adults & children</p>
            </div>
            <div className="cc-revamp-stepper">
              <button type="button" onClick={() => setGuests(Math.max(1, guests - 1))} disabled={guests <= 1}>−</button>
              <span>{guests}</span>
              <button type="button" onClick={() => setGuests(guests + 1)}>+</button>
            </div>
          </div>
        )}
      </div>
      <button className="cc-revamp-search-submit" type="submit">Search</button>
    </form>
  );
};

const PropertyCard = ({ property }) => {
  const [active, setActive] = useState(0);
  const images = property.images.length ? property.images : [];

  const move = (event, direction) => {
    event.preventDefault();
    event.stopPropagation();
    if (!images.length) return;
    setActive((index) => (index + direction + images.length) % images.length);
  };

  return (
    <a className="cc-revamp-card" href={property.url}>
      <div className={`cc-revamp-gallery cc-revamp-gallery--${property.key}`}>
        {images.length ? (
          <img src={images[active]} alt="" loading="lazy" />
        ) : (
          <div className="cc-revamp-placeholder">
            <svg viewBox="0 0 180 120" aria-hidden="true">
              <path d="M30 82h120M44 82V45h92v37M62 82V58h24v24M101 82V58h24v24M40 45h100" />
            </svg>
            <span>Property photography coming soon</span>
          </div>
        )}
        {images.length > 1 && (
          <>
            <button className="cc-revamp-gallery-arrow cc-revamp-gallery-arrow--prev" type="button" onClick={(event) => move(event, -1)} aria-label={`Previous ${property.title} image`}>
              ‹
            </button>
            <button className="cc-revamp-gallery-arrow cc-revamp-gallery-arrow--next" type="button" onClick={(event) => move(event, 1)} aria-label={`Next ${property.title} image`}>
              ›
            </button>
            <div className="cc-revamp-gallery-dots" aria-hidden="true">
              {images.slice(0, 3).map((image, index) => (
                <i className={index === active ? "is-active" : ""} key={image} />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="cc-revamp-card-meta">
        <div className="cc-revamp-card-row">
          <h3>{property.title}</h3>
          {property.rating ? <span className="cc-revamp-rating">★ {property.rating}</span> : <span className="cc-revamp-badge">{property.badge}</span>}
        </div>
        <p>{property.city}</p>
        <div className="cc-revamp-card-row cc-revamp-card-bottom">
          <span>{property.guests} guests · {property.bedrooms} bd · {property.bathrooms} ba</span>
          <strong>${property.price}<small> / night</small></strong>
        </div>
      </div>
    </a>
  );
};

const HomePageRevamp = ({ mountNode }) => {
  const { properties } = useProperties();
  const [links, setLinks] = useState(DEFAULT_LINKS);
  const [images, setImages] = useState({});
  const [isMenuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (mountNode?.dataset?.links) {
      try {
        setLinks({ ...DEFAULT_LINKS, ...JSON.parse(mountNode.dataset.links) });
      } catch (error) {
        setLinks(DEFAULT_LINKS);
      }
    }

    if (mountNode?.dataset?.images) {
      try {
        setImages(JSON.parse(mountNode.dataset.images));
      } catch (error) {
        setImages({});
      }
    }
  }, [mountNode]);

  const featured = useMemo(
    () =>
      FEATURED_CONFIG.map((config) => {
        const synced = matchProperty(properties, config) || {};
        const gallery = uniqueImages(
          synced.image,
          images.propertyImages?.[config.key] || [],
        ).slice(0, 3);

        return {
          ...config,
          ...synced,
          key: config.key,
          title: config.title,
          city: firstPresent(synced.city, config.city),
          guests: syncedNumber(synced.guests, config.guests, 2),
          bedrooms: syncedNumber(synced.bedrooms, config.bedrooms),
          bathrooms: syncedNumber(synced.bathrooms, config.bathrooms),
          price: syncedNumber(synced.price, config.price),
          url: synced.url || links.stays,
          images: gallery,
        };
      }),
    [images.propertyImages, links.stays, properties],
  );

  const propertyUrl = (title) => {
    const config = FEATURED_CONFIG.find((item) => item.title === title);
    const match = config ? featured.find((item) => item.key === config.key) : null;
    return match?.url || links.stays;
  };
  const heroImage = featured.find((property) => property.images?.length) || featured[0];

  const navLinks = [
    ["Stays", links.stays],
    ["About Us", links.about],
    ["Contact", links.contact],
    ["Partner With Us ↗", links.partner],
    ["Owners ↗", links.owners],
  ];

  return (
    <main className="cc-revamp">
      <section className="cc-revamp-hero">
        <ImagePanel property={heroImage} image={images.hero} ratio="21 / 9" priority />
        <CcWatermark />
        <header className="cc-revamp-nav">
          <a href={links.home} aria-label="CC Stays home">
            <LogoMark logo={images.logo} />
          </a>
          <nav>
            {navLinks.map(([label, href]) => <a href={href} key={label}>{label}</a>)}
          </nav>
          <button className="cc-revamp-menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation">
            <span />
            <span />
          </button>
        </header>
        <div className={`cc-revamp-drawer ${isMenuOpen ? "is-open" : ""}`}>
          {navLinks.map(([label, href]) => (
            <a href={href} key={label} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
        </div>
        <div className="cc-revamp-hero-inner cc-revamp-wrap">
          <h1>Stay somewhere<br />you&apos;ll <em>remember.</em></h1>
          <HomeSearch properties={properties} featured={featured} links={links} />
          <p className="cc-revamp-proof">Guest-first travel <span>•</span> Only the best homes <span>•</span> 24/7 concierge <span>•</span> Direct rates, no platform markup</p>
        </div>
      </section>

      <section className="cc-revamp-section cc-revamp-collection">
        <div className="cc-revamp-wrap">
          <div className="cc-revamp-section-head">
            <div>
              <div className="cc-revamp-eyebrow">The Collection</div>
              <h2>Find your stay.</h2>
            </div>
            <a className="cc-revamp-text-link" href={links.stays}>View all stays <span>→</span></a>
          </div>
          <div className="cc-revamp-rail">
            {featured.map((property) => <PropertyCard property={property} key={property.key} />)}
          </div>
        </div>
      </section>

      <section className="cc-revamp-section cc-revamp-philosophy">
        <div className="cc-revamp-wrap">
          <div className="cc-revamp-eyebrow">Our Philosophy</div>
          <h2>The privacy of a home.<br /><span>The standards of a hotel.</span></h2>

          <div className="cc-revamp-story cc-revamp-story--wide">
            <div className="cc-revamp-story-copy">
              <div className="cc-revamp-eyebrow2">Designed for the Stay</div>
              <h3>Spaces you settle into.</h3>
              <p>Every home is thoughtfully designed around how people actually live, gather, and unwind.</p>
            </div>
            <img src={images.storyOne} alt="" loading="lazy" />
          </div>

          <div className="cc-revamp-story cc-revamp-story--arch">
            <div className="cc-revamp-story-copy">
              <div className="cc-revamp-eyebrow2">Comfort, Everywhere</div>
              <h3>Made to feel as good as it looks.</h3>
              <p>Comfortable beds, generous spaces, and the privacy to settle in and make the home your own.</p>
            </div>
            <div className="cc-revamp-arch-media">
              <img src={images.storyTwo} alt="" loading="lazy" />
              <img src={images.storyInset} alt="" loading="lazy" />
            </div>
          </div>

          <div className="cc-revamp-story cc-revamp-story--split">
            <img src={images.storyThree} alt="" loading="lazy" />
            <div className="cc-revamp-story-copy">
              <div className="cc-revamp-eyebrow">Hospitality That Travels With You</div>
              <h3>Cared for, the entire way.</h3>
              <p>From your first message to checkout, there&apos;s someone who knows the home and the neighborhood. Close when you need something, out of the way when you don&apos;t.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cc-revamp-trip-band">
        <CcWatermark />
        <h2 className="cc-revamp-white-text">Sometimes the stay <em>is</em> the trip.</h2>
        <a href={links.stays} >Explore the Collection <span>→</span></a>
      </section>

      <section className="cc-revamp-section cc-revamp-reviews">
        <div className="cc-revamp-wrap">
          <div className="cc-revamp-eyebrow">What Guests Say</div>
          <div className="cc-revamp-review-score">
            <strong>4.99<span>★</span></strong>
            <p><b>300+ guest reviews</b><br />Across the collection, from guests who came back different.</p>
          </div>
          <div className="cc-revamp-review-rail">
            {REVIEWS.map((review) => (
              <a href={propertyUrl(review.property)} className="cc-revamp-review" key={review.quote}>
                <span>★★★★★</span>
                <q>{review.quote}</q>
                <strong>Airbnb guest</strong>
                <small>{review.meta}</small>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="cc-revamp-section cc-revamp-standard">
        <div className="cc-revamp-wrap">
          <div className="cc-revamp-eyebrow">The CC Stays Standard</div>
          <h2 className="cc-revamp-white-text">Everything you need.<br /><span>More than you expect.</span></h2>
          <div className="cc-revamp-standard-grid">
            {STANDARD_ITEMS.map(([icon, title, copy]) => (
              <div className="cc-revamp-standard-item" key={title}>
                <div><Icon name={icon} /></div>
                <section>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  {title === "Concierge, when you want it" && <a href={links.contact}>Ask CC Stays →</a>}
                </section>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cc-revamp-section cc-revamp-final">
        <div className="cc-revamp-eyebrow">Book With CC Stays</div>
        <h2>Take the trip.<br />We&apos;ll take care of the <em>stay.</em></h2>
        <p>Choose a residence you can feel good about booking, then start looking forward to everything else.</p>
        <a className="cc-revamp-button cc-revamp-white-text" href={links.stays}>Find your stay <span>→</span></a>
        <a className="cc-revamp-text-link" href={links.contact}>Need help choosing? Ask us <span>→</span></a>
      </section>

      <footer className="cc-revamp-footer">
        <div className="cc-revamp-wrap">
          <div className="cc-revamp-footer-grid">
            <div>
              <LogoMark logo={images.logo} compact />
              <p>Stay somewhere you&apos;ll remember.</p>
            </div>
            <nav>
              <strong>Stay</strong>
              <a href={links.stays}>All Stays</a>
              <a href={links.destinations}>Destinations</a>
              <a href={links.experiences}>Experiences</a>
            </nav>
            <nav>
              <strong>CC Stays</strong>
              <a href={links.about}>About Us</a>
              <a href={links.journal}>The Journal</a>
              <a href={links.contact}>Contact</a>
            </nav>
            <nav>
              <strong>Partners</strong>
              <a href={links.partner}>Partner With Us ↗</a>
              <a href={links.owners}>Owners ↗</a>
            </nav>
            <nav>
              <strong>Follow</strong>
              <a href={links.instagram}>Instagram</a>
            </nav>
          </div>
          <div className="cc-revamp-footer-bottom">
            <p>© 2026 CC Stays. All rights reserved.</p>
            <nav>
              <a href={links.privacy}>Privacy</a>
              <a href={links.terms}>Terms</a>
              <a href={links.accessibility}>Accessibility</a>
            </nav>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default HomePageRevamp;
