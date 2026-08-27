import React, { useEffect, useRef, useState } from "react";
import {
  CcWatermark,
  DEFAULT_EXACT_IMAGES,
  DEFAULT_EXACT_LINKS,
  ExactFooter,
  ExactHeader,
  ExactKick,
} from "./ExactLayout";
import "./InteriorPages.css";

const readMountData = (mountNode) => {
  let links = DEFAULT_EXACT_LINKS;
  let images = DEFAULT_EXACT_IMAGES;

  if (mountNode?.dataset?.links) {
    try {
      links = {
        ...DEFAULT_EXACT_LINKS,
        ...JSON.parse(mountNode.dataset.links),
      };
    } catch {
      links = DEFAULT_EXACT_LINKS;
    }
  }

  if (mountNode?.dataset?.images) {
    try {
      images = {
        ...DEFAULT_EXACT_IMAGES,
        ...JSON.parse(mountNode.dataset.images),
      };
    } catch {
      images = DEFAULT_EXACT_IMAGES;
    }
  }

  return { links, images };
};

const useMountData = (mountNode) => {
  const [data, setData] = useState(() => readMountData(mountNode));

  useEffect(() => {
    setData(readMountData(mountNode));
  }, [mountNode]);

  return data;
};

const DESTINATIONS = [
  {
    slug: "fort-lauderdale",
    name: "Fort Lauderdale",
    state: "Florida",
    region: "Greater Fort Lauderdale",
    tagline: "Beaches, boats, and the easiest kind of sunshine.",
  },
  {
    slug: "flagler-village",
    name: "Flagler Village",
    state: "Florida",
    region: "Greater Fort Lauderdale",
    tagline: "Murals, makers, and Fort Lauderdale's creative side.",
  },
  {
    slug: "las-olas",
    name: "Las Olas",
    state: "Florida",
    region: "Greater Fort Lauderdale",
    tagline: "The boulevard between downtown and the beach.",
  },
  {
    slug: "fort-lauderdale-beach",
    name: "Fort Lauderdale Beach",
    state: "Florida",
    region: "Greater Fort Lauderdale",
    tagline: "The wave wall, the promenade, and miles of open sand.",
  },
  {
    slug: "lauderdale-by-the-sea",
    name: "Lauderdale-by-the-Sea",
    state: "Florida",
    region: "Greater Fort Lauderdale",
    tagline: "A small beach town that never went high-rise.",
  },
  {
    slug: "wilton-manors",
    name: "Wilton Manors",
    state: "Florida",
    region: "Greater Fort Lauderdale",
    tagline: "The Island City. Walkable, colorful, and close to everything.",
  },
  {
    slug: "oakland-park",
    name: "Oakland Park",
    state: "Florida",
    region: "Greater Fort Lauderdale",
    tagline: "Breweries, food, and a neighborhood on the rise.",
  },
  {
    slug: "pompano-beach",
    name: "Pompano Beach",
    state: "Florida",
    region: "Greater Fort Lauderdale",
    tagline: "A fishing town growing into its waterfront.",
  },
  {
    slug: "blue-ridge",
    name: "Blue Ridge",
    state: "Georgia",
    region: "North Georgia Mountains",
    tagline: "Mountain air, trout streams, and a storybook downtown.",
  },
  {
    slug: "blairsville",
    name: "Blairsville",
    state: "Georgia",
    region: "North Georgia Mountains",
    tagline: "Waterfalls, vineyards, and the top of Georgia.",
  },
  {
    slug: "ellijay",
    name: "Ellijay",
    state: "Georgia",
    region: "North Georgia Mountains",
    tagline: "Georgia's apple capital, with trails in every direction.",
  },
  {
    slug: "dahlonega",
    name: "Dahlonega",
    state: "Georgia",
    region: "North Georgia Mountains",
    tagline: "Gold rush history in the heart of wine country.",
  },
  {
    slug: "helen",
    name: "Helen",
    state: "Georgia",
    region: "North Georgia Mountains",
    tagline: "A Bavarian village on the Chattahoochee.",
  },
];

const EXPERIENCES = [
  {
    icon: "boat",
    title: "Yacht & boat charters",
    copy: "Private days on the water, from sandbar afternoons to sunset cruises.",
    status: "soon",
  },
  {
    icon: "car",
    title: "Luxury & exotic car rentals",
    copy: "Arrive in something worth the drive.",
    status: "soon",
  },
  {
    icon: "compass",
    title: "Excursions & day trips",
    copy: "Everglades tours, fishing charters, mountain adventures, and more.",
    status: "soon",
  },
  {
    icon: "dine",
    title: "Private chefs & provisioning",
    copy: "Dinner at the house, or a kitchen stocked before you land.",
    status: "soon",
  },
  {
    icon: "bell",
    title: "Concierge planning",
    copy: "Reservations, recommendations, and special occasions, arranged by us.",
    status: "now",
  },
];

const CONTACT_REASONS = [
  "Planning a stay",
  "Current guest",
  "Trip planning / recommendations",
  "Something else",
];

const destinationHref = (links, slug) =>
  `${links.stays}?destination=${encodeURIComponent(slug)}`;

const ExperienceIcon = ({ name }) => {
  const paths = {
    boat: (
      <>
        <path d="M4 13h16l-2.6 5.2a2 2 0 0 1-1.8 1.1H8.4a2 2 0 0 1-1.8-1.1L4 13Z" />
        <path d="M8 13V7l5-2 3 8" />
        <path d="M3 21c1.2.7 2.4.7 3.6 0 1.2-.7 2.4-.7 3.6 0 1.2.7 2.4.7 3.6 0 1.2-.7 2.4-.7 3.6 0 1.2.7 2.4.7 3.6 0" />
      </>
    ),
    car: (
      <>
        <path d="M5 15h14l-1.4-4.2A2.6 2.6 0 0 0 15.1 9H8.9a2.6 2.6 0 0 0-2.5 1.8L5 15Z" />
        <path d="M6 15v4M18 15v4" />
        <path d="M8 19h.1M16 19h.1" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="m15 9-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    dine: (
      <>
        <path d="M6 3v18" />
        <path d="M4 3v6a2 2 0 0 0 4 0V3" />
        <path d="M16 3v18" />
        <path d="M16 3c2.2 1.4 3.2 3.2 3.2 5.4S18.1 12 16 12" />
      </>
    ),
    bell: (
      <>
        <path d="M6 17h12" />
        <path d="M8 17v-5a4 4 0 0 1 8 0v5" />
        <path d="M10 20h4" />
        <path d="M12 5V3" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name] || paths.compass}
    </svg>
  );
};

export const DestinationsPage = ({ mountNode }) => {
  const { links } = useMountData(mountNode);
  const groups = [
    {
      title: "Greater Fort Lauderdale",
      region: "Greater Fort Lauderdale",
    },
    {
      title: "The North Georgia Mountains",
      region: "North Georgia Mountains",
    },
  ];

  return (
    <main className="cc-exact cc-exact-interior">
      <ExactHeader links={links} />
      <div className="cc-exact-page-pad cc-exact-dest-hero">
        <div className="cc-exact-wrap cc-exact-dest-wrap cc-exact-dest-intro">
          <ExactKick>Destinations</ExactKick>
          <h1>
            Where to next<em className="cc-exact-accent">?</em>
          </h1>
          <p className="cc-exact-lede">
            Every CC Stays destination comes with local knowledge built in.
            Guides to the neighborhoods we know, and homes worth the trip.
          </p>
        </div>
      </div>

      <section className="cc-exact-section cc-exact-section-tight">
        <div className="cc-exact-wrap cc-exact-dest-wrap">
          {groups.map((group) => (
            <div className="cc-exact-dest-group" key={group.region}>
              <ExactKick>{group.title}</ExactKick>
              <div className="cc-exact-dest-grid">
                {DESTINATIONS.filter(
                  (destination) => destination.region === group.region,
                ).map((destination) => (
                  <a
                    className="cc-exact-dest-card"
                    href={destinationHref(links, destination.slug)}
                    key={destination.slug}
                  >
                    <span className="cc-exact-dc-body">
                      <span className="cc-exact-dc-region">
                        {destination.state}
                      </span>
                      <span className="cc-exact-dc-name">
                        {destination.name}
                      </span>
                      <span className="cc-exact-dc-copy">
                        {destination.tagline}
                      </span>
                    </span>
                    <span className="cc-exact-dc-link">
                      Explore {destination.name} <span>→</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cc-exact-section cc-exact-cream2 cc-exact-dest-cta">
        <div className="cc-exact-wrap cc-exact-centered">
          <ExactKick center>Experiences</ExactKick>
          <h2>
            Make the trip an <em className="cc-exact-accent">occasion.</em>
          </h2>
          <p className="cc-exact-lede">
            Boats, cars, excursions, and plans made for you.
          </p>
          <a className="cc-exact-btn-text" href={links.experiences}>
            Explore experiences <span>→</span>
          </a>
        </div>
      </section>
      <ExactFooter links={links} />
    </main>
  );
};

export const ExperiencesPage = ({ mountNode }) => {
  const { links } = useMountData(mountNode);

  return (
    <main className="cc-exact cc-exact-interior">
      <ExactHeader links={links} />
      <div className="cc-exact-page-pad cc-exact-exp-hero">
        <div className="cc-exact-wrap cc-exact-dest-intro">
          <ExactKick>Experiences</ExactKick>
          <h1>
            Make the trip an <em className="cc-exact-accent">occasion.</em>
          </h1>
          <p className="cc-exact-lede">
            A stay is only the beginning. Add the details that make the whole
            trip feel handled.
          </p>
        </div>
      </div>

      <section className="cc-exact-section cc-exact-section-tight">
        <div className="cc-exact-wrap">
          <div className="cc-exact-exp-grid">
            {EXPERIENCES.map((experience) => (
              <article className="cc-exact-exp-card" key={experience.title}>
                <span className="cc-exact-exp-icon">
                  <ExperienceIcon name={experience.icon} />
                </span>
                <div>
                  <div className="cc-exact-exp-head">
                    <h2>{experience.title}</h2>
                    <span
                      className={`cc-exact-dc-chip ${
                        experience.status === "now" ? "cc-exact-chip-now" : ""
                      }`}
                    >
                      {experience.status === "now"
                        ? "Available now"
                        : "Coming soon"}
                    </span>
                  </div>
                  <p>{experience.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cc-exact-section cc-exact-cream2">
        <div className="cc-exact-wrap cc-exact-centered">
          <ExactKick center>In the meantime</ExactKick>
          <h2>
            Planning something<em className="cc-exact-accent">?</em>
          </h2>
          <p className="cc-exact-lede">
            Tell us what you have in mind. We&apos;ll help where we can.
          </p>
          <a
            id="ask-cc-stays-experiences"
            className="cc-exact-btn cc-exact-btn-primary"
            href={`${links.contact}?reason=concierge`}
          >
            Ask CC Stays <span>→</span>
          </a>
        </div>
      </section>
      <ExactFooter links={links} />
    </main>
  );
};

export const AboutPage = ({ mountNode }) => {
  const { links } = useMountData(mountNode);

  return (
    <main className="cc-exact cc-exact-interior">
      <ExactHeader links={links} />
      <div className="cc-exact-page-pad cc-exact-about-hero">
        <div className="cc-exact-wrap cc-exact-about-hero-copy">
          <ExactKick>About CC Stays</ExactKick>
          <h1>
            Built around a better
            <br />
            way to <em className="cc-exact-accent">stay.</em>
          </h1>
          <p className="cc-exact-lede">
            CC Stays is a collection of private residences with the comfort of
            home and the care of great hospitality.
          </p>
        </div>
      </div>

      <section className="cc-exact-letter-sec cc-exact-on-dark">
        <div className="cc-exact-wrap">
          <div className="cc-exact-letter">
            <CcWatermark className="cc-exact-letter-stamp" />
            <span id="note-from-us-green-about">
              <ExactKick>A note from us</ExactKick>
            </span>
            <p>
              CC Stays started with a simple belief: where you stay can change
              the entire trip.
            </p>
            <p>
              We wanted the privacy and freedom of a home without giving up the
              thoughtfulness, consistency, and care you expect from great
              hospitality.
            </p>
            <p>
              Our goal is to build a collection of residences you can book with
              confidence. Different homes and different destinations, all with a
              standard you recognize.
            </p>
            <p className="cc-exact-letter-close">See you out there,</p>
            <span className="cc-exact-letter-sig">Chandler + Catherinne</span>
          </div>
        </div>
      </section>

      <section className="cc-exact-section">
        <div className="cc-exact-wrap">
          <div className="cc-exact-build-kick">
            <ExactKick>What We&apos;re Building</ExactKick>
          </div>
          <div className="cc-exact-build-grid">
            <div>
              <h3>A better home</h3>
              <p>
                Residences selected for comfort, character, amenities, and the
                way they actually feel to stay in.
              </p>
            </div>
            <div>
              <h3>A recognizable standard</h3>
              <p>
                Thoughtful essentials, comfortable beds, easy arrival, and homes
                prepared with care.
              </p>
            </div>
            <div>
              <h3>Hospitality that follows you</h3>
              <p>
                From local recommendations to help during the stay, our
                concierge is only a message away.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cc-exact-section cc-exact-cream2">
        <div className="cc-exact-wrap cc-exact-centered">
          <ExactKick center>White-Glove Concierge</ExactKick>
          <h2>
            Your trip, <em className="cc-exact-accent">better.</em>
          </h2>
          <p className="cc-exact-lede">Need something? Ask us.</p>
          <a
            className="cc-exact-btn-text"
            href={`${links.contact}?reason=concierge`}
          >
            Ask CC Stays <span>→</span>
          </a>
        </div>
      </section>

      <section className="cc-exact-close-spread">
        <div className="cc-exact-wrap cc-exact-centered">
          <h2>
            Different places.
            <br />
            One way of <em className="cc-exact-accent-green">staying.</em>
          </h2>
          <a
            id="explore-the-collection-about"
            className="cc-exact-btn cc-exact-btn-primary"
            href={links.stays}
          >
            Explore the Collection <span>→</span>
          </a>
        </div>
      </section>
      <ExactFooter links={links} />
    </main>
  );
};

export const JournalPage = ({ mountNode }) => {
  const { links } = useMountData(mountNode);
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    error: "",
  });

  const submit = async (event) => {
    event.preventDefault();
    const input = event.currentTarget.querySelector("input");
    const email = input?.value.trim() || "";
    if (!email || !email.includes("@")) {
      setStatus({
        loading: false,
        message: "",
        error: "Please enter a valid email.",
      });
      return;
    }

    setStatus({ loading: true, message: "", error: "" });

    try {
      const response = await fetch("/wp-json/cc-stays/v1/journal-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "We could not save that email yet.");
      }

      input.value = "";
      setStatus({
        loading: false,
        message: data.message || "You're on the list.",
        error: "",
      });
    } catch (error) {
      setStatus({
        loading: false,
        message: "",
        error: error.message || "We could not save that email yet.",
      });
    }
  };

  return (
    <main className="cc-exact cc-exact-interior">
      <ExactHeader links={links} />
      <div className="cc-exact-page-pad cc-exact-journal-hero">
        <div className="cc-exact-wrap cc-exact-centered">
          <ExactKick center>The Journal</ExactKick>
          <h1>
            Stories worth the <em className="cc-exact-accent">stay.</em>
          </h1>
          <p className="cc-exact-lede">
            Destination guides, home stories, and the art of staying well. The
            first issue is on its way.
          </p>
          <form className="cc-exact-jn-form" onSubmit={submit} noValidate>
            <input
              type="email"
              placeholder="Your email"
              aria-label="Email address"
              required
            />
            <button
              className="cc-exact-btn cc-exact-btn-primary"
              type="submit"
              disabled={status.loading}
            >
              {status.loading ? "Saving..." : "Notify me"}
            </button>
          </form>
          <p
            className={`cc-exact-small ${
              status.error ? "cc-exact-form-error" : "cc-exact-muted"
            }`}
          >
            {status.error ||
              status.message ||
              "No noise. Just the good stuff, occasionally."}
          </p>
        </div>
      </div>
      <ExactFooter links={links} />
    </main>
  );
};

export const ContactPage = ({ mountNode }) => {
  const { links } = useMountData(mountNode);
  const reasonRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    reason: "",
    message: "",
    website: "",
  });
  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: "",
  });
  const [reasonOpen, setReasonOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") === "concierge") {
      setForm((current) => ({
        ...current,
        reason: "Trip planning / recommendations",
      }));
    }
  }, []);

  useEffect(() => {
    const closeReason = (event) => {
      if (reasonRef.current && !reasonRef.current.contains(event.target)) {
        setReasonOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setReasonOpen(false);
    };

    document.addEventListener("mousedown", closeReason);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeReason);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.reason) {
      setStatus({
        loading: false,
        success: false,
        error: "Please choose a reason for your message.",
      });
      return;
    }

    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }

    setStatus({ loading: true, success: false, error: "" });

    try {
      const response = await fetch("/wp-json/cc-stays/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "We could not send your message yet.");
      }

      setForm({
        name: "",
        email: "",
        phone: "",
        reason: "",
        message: "",
        website: "",
      });
      setStatus({ loading: false, success: true, error: "" });
    } catch (error) {
      setStatus({
        loading: false,
        success: false,
        error: error.message || "We could not send your message yet.",
      });
    }
  };

  return (
    <main className="cc-exact cc-exact-interior">
      <ExactHeader links={links} />
      <div className="cc-exact-page-pad cc-exact-contact-hero">
        <div className="cc-exact-wrap cc-exact-contact-intro">
          <ExactKick>Contact CC Stays</ExactKick>
          <h1>
            How can we <em className="cc-exact-accent">help?</em>
          </h1>
          <p className="cc-exact-lede">
            Questions before your stay, help planning your trip, or something
            you need while you&apos;re here. We&apos;re happy to help.
          </p>
        </div>
      </div>

      <section className="cc-exact-section cc-exact-contact-section">
        <div className="cc-exact-wrap cc-exact-contact-grid">
          {status.success ? (
            <div className="cc-exact-form-ok">
              <span className="cc-exact-serif">Message sent.</span>
              We&apos;ll get back to you shortly.
            </div>
          ) : (
            <form className="cc-exact-form" onSubmit={submit}>
              <div className="cc-exact-f-row">
                <label className="cc-exact-f-field">
                  <span>Name</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    autoComplete="name"
                    required
                  />
                </label>
                <label className="cc-exact-f-field">
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateField}
                    autoComplete="email"
                    required
                  />
                </label>
              </div>

              <div className="cc-exact-f-row">
                <label className="cc-exact-f-field">
                  <span style={{ color: "var(--muted)" }}>
                    Phone <span style={{ fontWeight: 400 }}>(optional)</span>
                  </span>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={updateField}
                    autoComplete="tel"
                  />
                </label>
                <div
                  className="cc-exact-f-field cc-exact-reason-field"
                  ref={reasonRef}
                >
                  <span>Reason</span>
                  <input type="hidden" name="reason" value={form.reason} />
                  <button
                    type="button"
                    className={`cc-exact-reason-trigger ${
                      reasonOpen ? "is-open" : ""
                    }`}
                    onClick={() => setReasonOpen((open) => !open)}
                    aria-haspopup="listbox"
                    aria-expanded={reasonOpen}
                  >
                    <span className={form.reason ? "" : "is-placeholder"}>
                      {form.reason || "Choose one"}
                    </span>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <div
                    className={`cc-exact-reason-menu ${
                      reasonOpen ? "is-open" : ""
                    }`}
                    role="listbox"
                  >
                    {CONTACT_REASONS.map((reason) => (
                      <button
                        type="button"
                        className={`cc-exact-reason-option ${
                          form.reason === reason ? "is-selected" : ""
                        }`}
                        role="option"
                        aria-selected={form.reason === reason}
                        key={reason}
                        onClick={() => {
                          setForm((current) => ({
                            ...current,
                            reason,
                          }));
                          setReasonOpen(false);
                          setStatus((current) => ({
                            ...current,
                            error: "",
                          }));
                        }}
                      >
                        <span className="cc-exact-reason-check">
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M5 12l4 4L19 6" />
                          </svg>
                        </span>
                        <span>{reason}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label className="cc-exact-f-field">
                <span>Message</span>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={updateField}
                  rows={7}
                  required
                />
              </label>

              <label className="cc-exact-honeypot" aria-hidden="true">
                <span>Website</span>
                <input
                  name="website"
                  value={form.website}
                  onChange={updateField}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>

              {status.error && (
                <p className="cc-exact-form-error">{status.error}</p>
              )}
              <button
                className="cc-exact-btn cc-exact-btn-primary"
                type="submit"
                disabled={status.loading}
              >
                {status.loading ? "Sending..." : "Send message"}
              </button>
            </form>
          )}

          <aside className="cc-exact-contact-aside">
            <div className="cc-exact-concierge-box">
              <h2>Planning something?</h2>
              <p>
                Looking for a recommendation, celebrating something special, or
                just not sure where to start? Tell us what you have in mind.
              </p>
            </div>
            <div className="cc-partner-box">
              <p>Own a property or want to work with CC Stays?</p>
              <a className="cc-exact-btn-text" href={links.partner}>
                Partner With Us <span>↗</span>
              </a>
            </div>
          </aside>
        </div>
      </section>
      <ExactFooter links={links} />
    </main>
  );
};
