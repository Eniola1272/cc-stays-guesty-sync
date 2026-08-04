import React, { useEffect, useMemo, useState } from "react";
import SearchBar from "./SearchBar";
import "./HomePageSections.css";

const DEFAULT_LINKS = {
  home: "/",
  stays: "/stays",
  bookDirect: "/book-direct",
  reviews: "/reviews",
  about: "/about-us",
  owners: "/partner-with-us",
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
    "01",
    "Only the Best Homes",
    "Every home is carefully selected, so you know you're booking somewhere exceptional.",
  ],
  [
    "02",
    "Design That Feels Better",
    "Thoughtfully designed spaces that aren't just beautiful - they change how your stay feels.",
  ],
  [
    "03",
    "Effortless Stays",
    "From booking to checkout, everything is simple, seamless, and handled for you.",
  ],
  [
    "04",
    "Exceptional Amenities",
    "Fast WiFi, fully equipped kitchens, pools, gathering spaces, and thoughtful extras - everything you need and nothing you don't.",
  ],
  [
    "05",
    "Real Support, When You Need It",
    "Questions, recommendations, special requests, or the unexpected - our team is here to help.",
  ],
  [
    "06",
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

const Rule = () => (
  <div className="cc-home-rule" aria-hidden="true">
    <span />
    <svg viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" />
      <line x1="20" y1="8" x2="20" y2="32" stroke="currentColor" />
    </svg>
    <span />
  </div>
);

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

const HomePageSections = ({ mountNode }) => {
  const [properties, setProperties] = useState([]);
  const [links, setLinks] = useState(DEFAULT_LINKS);
  const [images, setImages] = useState({});

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
    () =>
      featuredFallbacks.map((fallback, index) => ({
        ...fallback,
        ...(findProperty(properties, fallback.title) || properties[index] || {}),
      })),
    [properties],
  );

  const imageSet = featured.filter((property) => property?.image);
  const detailImage = imageSet[0] || featured[0];
  const founderImage = imageSet[1] || featured[1] || detailImage;
  const finalImage = imageSet[2] || featured[2] || detailImage;
  const heroImage = imageSet[3] || detailImage;
  const cardImages = [images.cardOne, images.cardTwo, images.cardThree];
  const reviewImages = [images.reviewOne, images.reviewTwo, images.reviewThree];

  const propertyUrl = (title) => findProperty(properties, title)?.url || links.stays;

  return (
    <main className="cc-homepage-sections">
      <section className="cc-home-hero">
        <ImagePanel property={heroImage} image={images.hero} ratio="21 / 9" priority />
        <div className="cc-home-hero-scrim" />
        <header className="cc-home-header">
          <a className="cc-home-logo" href={links.home} aria-label="CC Stays home">
            <span>C|C</span>
            <strong>STAYS</strong>
          </a>
          <nav className="cc-home-nav" aria-label="Homepage navigation">
            <a href={links.stays}>Our Stays</a>
            <a href={links.about}>About Us</a>
            <a href={links.bookDirect}>Book Direct</a>
            <a href={links.faq}>FAQ</a>
            <a href={links.contact}>Contact</a>
          </nav>
          <a className="cc-home-header-button" href={links.stays}>
            Find a Stay
          </a>
          <a className="cc-home-menu-link" href={links.stays}>
            Stays
          </a>
        </header>
        <div className="cc-home-hero-content">
          <h1>Stay somewhere you'll remember.</h1>
          <p>Every CC Stay is designed to feel like the trip already started.</p>
          <div className="cc-home-hero-search">
            <SearchBar />
          </div>
          <a className="cc-home-mobile-search" href={links.stays}>
            <span>Start your search</span>
            <strong>Explore</strong>
          </a>
          <div className="cc-home-trust">
            <span>★★★★★</span>
            <p>Guest-loved homes for group trips, quiet escapes, and long weekends.</p>
          </div>
        </div>
      </section>

      <section className="cc-home-section cc-home-featured">
        <div className="cc-home-wrap">
          <div className="cc-home-eyebrow">Featured Stays</div>
          <h2>Homes worth planning a trip around.</h2>
          <p className="cc-home-lead">
            Explore a selection of thoughtfully designed homes made for
            gathering, relaxing, and creating memories together.
          </p>
          <div className="cc-home-cards">
            {featured.map((property, index) => (
              <a
                className="cc-home-card"
                href={property.url || links.stays}
                key={property.title}
              >
                <ImagePanel property={property} image={cardImages[index]} />
                <h3>{property.title}</h3>
                <div className="cc-home-card-location">
                  {property.city || "Florida"}
                </div>
                <div className="cc-home-spec">
                  {property.bedrooms || 2} BR · {property.bathrooms || 2} BA ·
                  SLEEPS {property.guests || 6}
                </div>
              </a>
            ))}
          </div>
          <div className="cc-home-center">
            <a className="cc-home-text-link" href={links.stays}>
              View all stays →
            </a>
          </div>
        </div>
      </section>

      <Rule />

      <section className="cc-home-dark">
        <div className="cc-home-statement cc-home-wrap">
          <div className="cc-home-eyebrow">Not Your Typical Stay</div>
          <div className="cc-home-statement-row">
            <h2>
              Most rentals are furnished.
              <br />
              Ours are <em>designed.</em>
            </h2>
            <ImagePanel
              property={detailImage}
              image={images.detail}
              className="cc-home-inset-image"
              ratio="1 / 1"
            />
          </div>
          <p>
            We believe where you stay shapes how the entire trip feels. That's
            why every CC Stay is thoughtfully selected, intentionally designed,
            and supported by people who genuinely care about your experience.
          </p>
        </div>

        <div className="cc-home-standard">
          <div className="cc-home-standard-image">
            <ImagePanel property={detailImage} image={images.standard} ratio="3 / 4" />
            <div>Thoughtfully designed, meticulously kept</div>
          </div>
          <div className="cc-home-standard-list">
            <div className="cc-home-standard-head">
              <div className="cc-home-eyebrow">The CC Stays Standard</div>
              <h2>Six things we hold to, in every home.</h2>
            </div>
            {standards.map(([number, title, copy]) => (
              <div className="cc-home-standard-item" key={number}>
                <div className="cc-home-number">{number}</div>
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
              How direct booking works →
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

      <section className="cc-home-duo">
        <div className="cc-home-management">
          <div className="cc-home-wrap cc-home-management-inner">
            <ImagePanel
              property={detailImage}
              image={images.manage}
              className="cc-home-feature-image"
              ratio="16 / 10"
            />
            <div className="cc-home-management-copy">
              <h2>We don't just manage. We transform.</h2>
              <p>
                We turn unique homes into high-performing hospitality assets
                through intentional design, revenue intelligence, in-house
                operations, and real hospitality standards.
              </p>
            </div>
          </div>
        </div>

        <div className="cc-home-host-teaser">
          <div className="cc-home-wrap cc-home-host-teaser-inner">
            <div className="cc-home-host-teaser-copy">
              <h2>Meet the Hosts</h2>
              <p>
                Meet the people shaping each CC Stay, from the design choices
                guests notice to the support that makes every arrival feel easy.
              </p>
              <a className="cc-home-button cc-home-button-compact" href={links.about}>
                Read More
              </a>
            </div>
            <ImagePanel
              property={founderImage}
              image={images.hostTeaser}
              className="cc-home-feature-image"
              ratio="16 / 10"
            />
          </div>
        </div>
      </section>

      <section className="cc-home-hosts">
        <div className="cc-home-host-image">
          <ImagePanel
            property={founderImage}
            image={images.hosts}
            className="cc-home-arch-image"
            ratio="3 / 4"
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

      <section className="cc-home-partner">
        <div className="cc-home-wrap">
          <div className="cc-home-eyebrow">Partner With Us</div>
          <h2>Your home should be more than another listing.</h2>
          <div className="cc-home-partner-cols">
            <p>
              We partner with owners of distinctive homes to elevate their
              design, strengthen their performance, and deliver the kind of
              hospitality guests remember.
            </p>
            <p>
              Every property in our collection is thoughtfully positioned,
              professionally operated, and held to the standards behind every CC
              Stay.
            </p>
          </div>
          <div className="cc-home-partner-foot">
            <span>We take on a limited number of homes each year</span>
            <a className="cc-home-text-link" href={links.owners}>
              See if your home is a fit →
            </a>
          </div>
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

export default HomePageSections;
