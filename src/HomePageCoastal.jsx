import React, { useEffect, useMemo, useRef, useState } from "react";
import SearchBar from "./SearchBar";
import "./HomePageSections.css";
import "./HomePageCoastal.css";

const DEFAULT_LINKS = {
  home: "/",
  stays: "/stays",
  bookDirect: "/about",
  reviews: "/reviews",
  about: "/about",
  owners: "https://ccstays.guestyowners.com/",
  faq: "/faq",
  contact: "/contact",
};

const featuredFallbacks = [
  {
    title: "Villa Banana",
    city: "Wilton Manors, Florida",
    bedrooms: 4,
    bathrooms: 3,
    guests: 10,
  },
  {
    title: "Bamboo Bliss",
    city: "Fort Lauderdale, Florida",
    bedrooms: 4,
    bathrooms: 4,
    guests: 8,
  },
  {
    title: "Manatee Manors",
    city: "Wilton Manors, Florida",
    bedrooms: 2,
    bathrooms: 2,
    guests: 6,
  },
];

const reviews = [
  {
    text: "The house was immaculate and the backyard was better than the photos. Every question we had was answered within minutes.",
    meta: "Airbnb · March 2026",
    guest: "Madeline R.",
    property: "Villa Banana",
  },
  {
    text: "Nine of us and nobody felt on top of anyone else. The kitchen had everything, and we ended up cooking in every night.",
    meta: "Vrbo · February 2026",
    guest: "Robbie T.",
    property: "Bamboo Bliss",
  },
  {
    text: "You can tell someone actually thought about this house rather than just furnishing it. Cleanest place we've stayed, anywhere.",
    meta: "Direct · May 2026",
    guest: "Samuel K.",
    property: "Manatee Manors",
  },
];

const standards = [
  [
    "shield",
    "Only the Best Homes",
    "Every home is carefully selected, so you know you're booking somewhere exceptional.",
  ],
  [
    "star",
    "Design That Feels Better",
    "Thoughtfully designed spaces that aren't just beautiful - they change how your stay feels.",
  ],
  [
    "house",
    "Effortless Stays",
    "From booking to checkout, everything is simple, seamless, and handled for you.",
  ],
  [
    "heart",
    "Exceptional Amenities",
    "Fast WiFi, fully equipped kitchens, pools, gathering spaces, and thoughtful extras - everything you need and nothing you don't.",
  ],
  [
    "clock",
    "Real Support, When You Need It",
    "Questions, recommendations, special requests, or the unexpected - our team is here to help.",
  ],
  [
    "check",
    "Spotless, Every Time",
    "Meticulous cleaning and inspection standards mean every home feels fresh, consistent, and completely ready for your arrival.",
  ],
];

const benefits = [
  ["tag", "Our best available rate"],
  ["fee", "No third-party service fees"],
  ["chat", "Talk directly with our team"],
  ["clock", "Priority for early check-in and late checkout"],
];

const normalize = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const findProperty = (properties, title) => {
  const target = normalize(title);
  return (
    properties.find((property) => normalize(property.title).includes(target)) ||
    properties.find((property) => target.includes(normalize(property.title))) ||
    null
  );
};

const Icon = ({ type }) => {
  if (type === "tag") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2.8 2.8h8.1l10.3 10.3-8.1 8.1L2.8 10.9V2.8z" />
        <circle cx="7.3" cy="7.3" r="1.5" />
      </svg>
    );
  }

  if (type === "fee") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9.2" />
        <line x1="5.5" y1="18.5" x2="18.5" y2="5.5" />
        <path d="M12 7.4v9.2" />
      </svg>
    );
  }

  if (type === "chat") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 11.6a8.4 8.4 0 0 1-8.4 8.4H4.2l2.5-2.6A8.4 8.4 0 1 1 21 11.6z" />
        <path d="M9 11h6M9 14.4h3.6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 6.6V12l3.7 2.2" />
    </svg>
  );
};

const BedIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3.5 11.2V19M20.5 19v-4.8a3 3 0 0 0-3-3H8.2a3 3 0 0 0-3 3V19M5.2 15.8h15.3M7.4 11.2V7.8h5.1a2 2 0 0 1 2 2v1.4" />
  </svg>
);

const BathIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 12.5h16v1.2a5.8 5.8 0 0 1-5.8 5.8H9.8A5.8 5.8 0 0 1 4 13.7v-1.2zM7 12.5V6.7a2.2 2.2 0 0 1 4.4 0M10.4 7.2h3" />
  </svg>
);

const GuestIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="7.4" r="3.2" />
    <path d="M5.6 20.2a6.4 6.4 0 0 1 12.8 0" />
  </svg>
);

const PillarIcon = ({ type }) => {
  if (type === "shield") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.6 18.2 6v5.2c0 4.1-2.5 7.7-6.2 9.2-3.7-1.5-6.2-5.1-6.2-9.2V6L12 3.6z" />
      </svg>
    );
  }

  if (type === "star") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 4.2 2.2 4.5 5 .7-3.6 3.5.9 4.9-4.5-2.4-4.5 2.4.9-4.9-3.6-3.5 5-.7L12 4.2z" />
      </svg>
    );
  }

  if (type === "house") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.6 10.9 12 4.8l7.4 6.1" />
        <path d="M6.6 9.8v9.4h10.8V9.8" />
        <path d="M10 19.2v-5.4h4v5.4" />
      </svg>
    );
  }

  if (type === "heart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 19.2s-6.8-4.1-6.8-9.1A3.8 3.8 0 0 1 12 7.8a3.8 3.8 0 0 1 6.8 2.3c0 5-6.8 9.1-6.8 9.1z" />
      </svg>
    );
  }

  if (type === "clock") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="7.4" />
        <path d="M12 7.8v4.4l3 1.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.7 12.7 9.2 17 19.3 7" />
      <path d="M7.3 7.2h-2a1.8 1.8 0 0 0-1.8 1.8v9.2A1.8 1.8 0 0 0 5.3 20h13.4a1.8 1.8 0 0 0 1.8-1.8V9a1.8 1.8 0 0 0-1.8-1.8h-2" />
      <path d="M9 5h6v4H9z" />
    </svg>
  );
};

const ImagePanel = ({
  property,
  image,
  className = "",
  ratio = "4 / 5",
  priority = false,
}) => {
  const sources = useMemo(
    () => [...new Set([image, property?.image].filter(Boolean))],
    [image, property?.image],
  );
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [sources]);

  const currentSource = sources[sourceIndex];

  return (
    <div
      className={`cc-home-image ${className}`}
      style={{
        aspectRatio: ratio,
      }}
    >
      {currentSource && (
        <img
          src={currentSource}
          alt=""
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          onError={() => setSourceIndex((index) => index + 1)}
        />
      )}
    </div>
  );
};

const HomePageCoastal = ({ mountNode }) => {
  const [properties, setProperties] = useState([]);
  const [links, setLinks] = useState(DEFAULT_LINKS);
  const [images, setImages] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const featuredScrollerRef = useRef(null);

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

  useEffect(() => {
    fetch("/wp-json/cc-stays/v1/search-stays")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) setProperties(data);
      })
      .catch(() => setProperties([]));
  }, []);

  const featured = useMemo(
    () => {
      const primary = featuredFallbacks.map((fallback, index) => ({
        ...fallback,
        ...(findProperty(properties, fallback.title) || properties[index] || {}),
      }));
      const primaryKeys = new Set(primary.map((property) => normalize(property.title)));
      const additional = properties.filter(
        (property) => property?.title && !primaryKeys.has(normalize(property.title)),
      );

      return [...primary, ...additional];
    },
    [properties],
  );

  const imageSet = featured.filter((property) => property?.image);
  const detailImage = imageSet[0] || featured[0];
  const founderImage = imageSet[1] || featured[1] || detailImage;
  const finalImage = imageSet[2] || featured[2] || detailImage;
  const heroImage = imageSet[3] || detailImage;
  const cardImages = [images.cardOne, images.cardTwo, images.cardThree];
  const reviewImages = [images.reviewOne, images.reviewTwo, images.reviewThree];
  const logoImage = images.logo;

  const propertyUrl = (title) => findProperty(properties, title)?.url || links.stays;
  const scrollFeatured = (direction) => {
    const scroller = featuredScrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction * scroller.clientWidth,
      behavior: "smooth",
    });
  };
  const navLinks = [
    ["Our Stays", links.stays],
    ["About Us", links.about],
    ["Partner With Us", links.owners],
    ["FAQ", links.faq],
    ["Contact", links.contact],
  ];

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <main className="cc-homepage-sections cc-homepage-coastal">
      <section className="cc-home-hero">
        <ImagePanel property={heroImage} image={images.hero} ratio="21 / 9" priority />
        <div className="cc-home-hero-scrim" />
        <header className="cc-home-header">
          <a className="cc-home-logo" href={links.home} aria-label="CC Stays home">
            <img src={logoImage} alt="CC Stays" />
          </a>
          <nav className="cc-home-nav" aria-label="Homepage navigation">
            {navLinks.map(([label, href]) => (
              <a href={href} key={label}>{label}</a>
            ))}
          </nav>
          <a className="cc-home-header-button" href={links.stays}>
            Book Now
          </a>
          <button
            type="button"
            className={`cc-home-menu-button ${isMobileMenuOpen ? "cc-home-menu-button--open" : ""}`}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </header>
        <div className={`cc-home-mobile-menu ${isMobileMenuOpen ? "cc-home-mobile-menu--open" : ""}`}>
          <nav aria-label="Mobile homepage navigation">
            {navLinks.map(([label, href]) => (
              <a href={href} key={label} onClick={() => setIsMobileMenuOpen(false)}>
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className="cc-home-hero-content">
          <h1>Stay somewhere you'll remember.</h1>
          <p>Every CC Stay is designed to feel like the trip already started.</p>
          <div className="cc-home-hero-search">
            <SearchBar showLocation={false} />
          </div>
          <div className="cc-home-trust">
            <span>★★★★★</span>
            <p>Guest-loved homes for group trips, quiet escapes, and long weekends.</p>
          </div>
        </div>
      </section>

      <section className="cc-home-section cc-home-featured cc-home-coastal-featured">
        <div className="cc-home-wrap">
          <div className="cc-home-featured-layout">
            <div className="cc-home-featured-intro">
              <div className="cc-home-eyebrow">Featured Stays</div>
              <h2>Stays designed around the trip.</h2>
              <div className="cc-home-featured-actions">
                <a className="cc-home-text-link" href={links.stays}>
                  View all stays →
                </a>
              </div>
            </div>
            <div className="cc-home-carousel-shell">
              <div className="cc-home-featured-arrows" aria-label="Featured stays controls">
                <button
                  className="cc-home-featured-arrow cc-home-featured-arrow--prev"
                  type="button"
                  aria-label="Previous featured stays"
                  onClick={() => scrollFeatured(-1)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m15 5-7 7 7 7" />
                  </svg>
                </button>
                <button
                  className="cc-home-featured-arrow cc-home-featured-arrow--next"
                  type="button"
                  aria-label="Next featured stays"
                  onClick={() => scrollFeatured(1)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 5 7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div
                className="cc-home-cards"
                aria-label="Featured stays carousel"
                ref={featuredScrollerRef}
              >
                {featured.map((property, index) => (
                  <a
                    className="cc-home-card cc-home-stay-card"
                    href={property.url || links.stays}
                    key={property.title}
                  >
                    <ImagePanel property={property} image={cardImages[index]} ratio="5 / 4" />
                    <div className="cc-home-stay-card-body">
                      <h3>{property.title}</h3>
                      <div className="cc-home-card-location">
                        {property.city || "Florida"}
                      </div>
                      <div className="cc-home-spec">
                        <span><BedIcon /> {property.bedrooms || 2} Beds</span>
                        <span><BathIcon /> {property.bathrooms || 2} Baths</span>
                        <span><GuestIcon /> {property.guests || 6} Guests</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cc-home-dark">
        <div className="cc-home-statement cc-home-wrap">
          <div className="cc-home-eyebrow">Not Your Typical Stay</div>
          <div className="cc-home-statement-row">
            <div className="cc-home-statement-copy">
              <h2>
                Most rentals are furnished.
                <br />
                Ours are <em>designed.</em>
              </h2>
              <p>
                We believe where you stay shapes how the entire trip feels.
                That's why every CC Stay is thoughtfully selected, intentionally
                designed, and supported by people who genuinely care about your
                experience.
              </p>
            </div>
            <ImagePanel
              property={detailImage}
              image={images.detail}
              className="cc-home-inset-image"
              ratio="4 / 3"
            />
          </div>
          <div className="cc-home-reed cc-home-reed-muted cc-home-reed-thin" />
        </div>

        <div className="cc-home-standard">
          <div className="cc-home-standard-image">
            <ImagePanel property={detailImage} image={images.standard} ratio="3 / 4" />
          </div>
          <div className="cc-home-standard-list">
            <div className="cc-home-standard-head">
              <div className="cc-home-eyebrow">The CC Stays Standard</div>
              <h2>Six things we hold to, in every home.</h2>
            </div>
            {standards.map(([icon, title, copy]) => (
              <div className="cc-home-standard-item" key={title}>
                <div className="cc-home-pillar-icon">
                  <PillarIcon type={icon} />
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="cc-home-band">
        <div className="cc-home-wrap">
          <div className="cc-home-reed cc-home-reed-muted cc-home-reed-thin" />
          <div className="cc-home-band-top">
            <h2>A better way to book your stay.</h2>
            <p>
              Book directly with CC Stays for our best available rate, personal
              support, and a more flexible experience - without unnecessary
              third-party fees.
            </p>
          </div>
          <div className="cc-home-benefits">
            {benefits.map(([icon, title]) => (
              <div className="cc-home-benefit" key={title}>
                <Icon type={icon} />
                <div>{title}</div>
              </div>
            ))}
          </div>
          <div className="cc-home-actions">
            <a className="cc-home-button" href={links.stays}>
              Book Direct
            </a>
            <a className="cc-home-text-link" href={links.bookDirect}>
              About Us →
            </a>
          </div>
        </div>
      </section>

      <section className="cc-home-section cc-home-reviews">
        <div className="cc-home-wrap">
          <div className="cc-home-eyebrow">What Our Guests Say</div>
          <h2>Hospitality you can feel.</h2>
          <p className="cc-home-lead">
            From spotless arrivals to thoughtful amenities and responsive
            support, the smallest details often become the things our guests
            remember most.
          </p>
          <div className="cc-home-review-grid">
            {reviews.map((review, index) => (
              <div className="cc-home-review" key={review.guest}>
                <div className="cc-home-stars">★★★★★</div>
                <q>{review.text}</q>
                <div className="cc-home-review-meta">
                  <ImagePanel
                    property={featured[index]}
                    image={reviewImages[index]}
                    className="cc-home-review-thumb"
                    ratio="1 / 1"
                  />
                  {review.meta}
                </div>
                <div className="cc-home-review-who">
                  {review.guest} —{" "}
                  <a href={propertyUrl(review.property)}>{review.property}</a>
                </div>
              </div>
            ))}
          </div>
          <div className="cc-home-center">
            <a className="cc-home-text-link" href={links.reviews}>
              Read more guest reviews →
            </a>
          </div>
        </div>
      </section>

      <section className="cc-home-hosts">
        <div className="cc-home-host-image">
          <ImagePanel
            property={founderImage}
            image={images.hosts}
            className="cc-home-arch-image"
            ratio="1 / 1"
          />
        </div>
        <div className="cc-home-host-copy">
          <div className="cc-home-eyebrow">Meet Your Hosts</div>
          <h2>Hospitality, personally.</h2>
          <p>We're Chandler and Catherinne, the two people behind CC Stays.</p>
          <p>
            We started with a simple belief: a vacation rental should feel as
            considered as a great hotel and as comfortable as home. We shape
            each property ourselves - the design, the amenities, the details you
            notice on the second morning rather than the first.
          </p>
          <p>
            Our goal was never to give people somewhere to sleep. It was to
            build homes where people gather, reconnect, celebrate, and leave
            carrying something with them.
          </p>
          <div className="cc-home-signature">— Chandler &amp; Catherinne</div>
          <a className="cc-home-text-link" href={links.about}>
            Our Story →
          </a>
        </div>
      </section>

      <section className="cc-home-final">
        <ImagePanel property={finalImage} image={images.final} ratio="21 / 9" />
        <div className="cc-home-final-overlay" />
        <div className="cc-home-final-content">
          <h2>Planning a trip?</h2>
          <p>Find a home that fits your stay, your group, and your style.</p>
          <a className="cc-home-button cc-home-button-ghost" href={links.stays}>
            Explore All Stays
          </a>
        </div>
      </section>
    </main>
  );
};

export default HomePageCoastal;
