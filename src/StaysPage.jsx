import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_EXACT_IMAGES,
  DEFAULT_EXACT_LINKS,
  ExactFooter,
  ExactHeader,
  ExactKick,
} from "./ExactLayout";
import "./StaysPage.css";

const FALLBACK_PROPERTIES = [
  {
    key: "bamboo",
    title: "Bamboo Bliss",
    city: "Fort Lauderdale",
    region: "Florida",
    guests: 8,
    bedrooms: 4,
    bathrooms: 4,
    price: 485,
    rating: 4.99,
    tags: ["Pool"],
    aliases: ["bamboo bliss", "bamboo"],
  },
  {
    key: "hidden",
    title: "Hidden Waters",
    city: "Morganton",
    region: "Georgia",
    guests: 8,
    bedrooms: 4,
    bathrooms: 3,
    price: 475,
    rating: 4.97,
    tags: ["Waterfront"],
    aliases: ["hidden waters", "blue ridge"],
  },
  {
    key: "villa",
    title: "Villa Banana",
    city: "Wilton Manors",
    region: "Florida",
    guests: 10,
    bedrooms: 4,
    bathrooms: 3,
    price: 365,
    badge: "New to CC Stays",
    tags: ["Pool", "Pet friendly"],
    aliases: ["villa banana", "banana"],
  },
  {
    key: "manatee",
    title: "Manatee Manors",
    city: "Wilton Manors",
    region: "Florida",
    guests: 8,
    bedrooms: 3,
    bathrooms: 2,
    price: 420,
    tags: ["Pool"],
    aliases: ["manatee manors", "manatee"],
  },
];

const money = (value) => `$${Number(value || 0).toLocaleString("en-US")}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const splitLocation = (location = "") => {
  const parts = String(location).split(",").map((part) => part.trim()).filter(Boolean);
  return {
    city: parts[0] || "Florida",
    region: parts[1] || "",
  };
};

const uniqueImages = (...groups) => {
  const seen = new Set();
  return groups.flat().filter(Boolean).filter((src) => {
    if (seen.has(src)) return false;
    seen.add(src);
    return true;
  });
};

const numberOr = (value, fallback, sentinel = null) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  if (sentinel !== null && number === sentinel && fallback !== sentinel) return fallback;
  return number;
};

const DESTINATION_QUERY_ALIASES = {
  "fort-lauderdale": ["fort lauderdale"],
  "las-olas": ["fort lauderdale", "las olas"],
  "fort-lauderdale-beach": ["fort lauderdale"],
  "wilton-manors": ["wilton manors"],
  "pompano-beach": ["pompano beach"],
  "blue-ridge": ["blue ridge", "morganton"],
  ellijay: ["ellijay"],
  helen: ["helen"],
};

const readDestinationQuery = () => {
  if (typeof window === "undefined") return "";
  return normalize(new URLSearchParams(window.location.search).get("destination"));
};

const matchesDestinationQuery = (property, destination) => {
  if (!destination) return true;
  const aliases = DESTINATION_QUERY_ALIASES[destination] || [destination];
  const haystack = normalize([
    property.title,
    property.city,
    property.region,
    ...(property.aliases || []),
  ].join(" "));
  return aliases.some((alias) => haystack.includes(normalize(alias)));
};

const matchProperty = (properties, fallback) => {
  const aliases = [fallback.title, ...(fallback.aliases || [])].map(normalize).filter(Boolean);
  return (
    properties.find((property) => aliases.includes(normalize(property.title))) ||
    properties.find((property) => aliases.some((alias) => normalize(property.title).includes(alias))) ||
    properties.find((property) => aliases.some((alias) => alias.includes(normalize(property.title))))
  );
};

const readMountData = (mountNode) => {
  let links = DEFAULT_EXACT_LINKS;
  let images = DEFAULT_EXACT_IMAGES;

  if (mountNode?.dataset?.links) {
    try {
      links = { ...DEFAULT_EXACT_LINKS, ...JSON.parse(mountNode.dataset.links) };
    } catch {
      links = DEFAULT_EXACT_LINKS;
    }
  }

  if (mountNode?.dataset?.images) {
    try {
      images = { ...DEFAULT_EXACT_IMAGES, ...JSON.parse(mountNode.dataset.images) };
    } catch {
      images = DEFAULT_EXACT_IMAGES;
    }
  }

  return { links, images };
};

const buildQuery = ({ checkIn, checkOut, guests }) => {
  const params = new URLSearchParams();
  if (checkIn) params.set("checkIn", checkIn);
  if (checkOut) params.set("checkOut", checkOut);
  if (guests > 0) params.set("guests", String(guests));
  return params.toString();
};

const Placeholder = () => (
  <div className="cc-exact-placeholder">
    <svg viewBox="0 0 180 120" aria-hidden="true">
      <path d="M30 82h120M44 82V45h92v37M62 82V58h24v24M101 82V58h24v24M40 45h100" />
    </svg>
    <span>Property photography coming soon</span>
  </div>
);

const SearchBar = ({ properties, links, onGuestFilter }) => {
  const [stay, setStay] = useState("any");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const submit = (event) => {
    event.preventDefault();
    if (stay && stay !== "any" && stay !== "all") {
      const selected = properties.find((property) => property.key === stay || String(property.id) === stay);
      const query = buildQuery({ checkIn, checkOut, guests });
      window.location.href = `${selected?.url || links.stays}${query ? `?${query}` : ""}`;
      return;
    }
    onGuestFilter(guests > 2 ? guests : 0);
  };

  return (
    <form className="cc-exact-searchbar" ref={ref} onSubmit={submit}>
      <label className="cc-exact-search-field cc-exact-field-stay">
        <span>Stay</span>
        <select value={stay} onChange={(event) => setStay(event.target.value)}>
          <option value="any">Any CC Stay</option>
          {properties.map((property) => (
            <option key={property.key || property.id || property.title} value={property.key || property.id}>
              {property.title}
            </option>
          ))}
          <option value="all">View all stays</option>
        </select>
      </label>
      <label className="cc-exact-search-field">
        <span>Check in</span>
        <input type="date" value={checkIn} min={todayISO()} onChange={(event) => setCheckIn(event.target.value)} />
      </label>
      <label className="cc-exact-search-field">
        <span>Check out</span>
        <input type="date" value={checkOut} min={checkIn || todayISO()} onChange={(event) => setCheckOut(event.target.value)} />
      </label>
      <div className="cc-exact-search-field cc-exact-field-who">
        <span>Who</span>
        <button type="button" className="cc-exact-guest-display" onClick={() => setOpen((value) => !value)}>
          {guests} guest{guests > 1 ? "s" : ""}
        </button>
        <div className={`cc-exact-guest-pop ${open ? "open" : ""}`} role="dialog" aria-label="Guests">
          <div className="cc-exact-stepper">
            <span>Guests</span>
            <div>
              <button type="button" onClick={() => setGuests(Math.max(1, guests - 1))} disabled={guests <= 1}>−</button>
              <b>{guests}</b>
              <button type="button" onClick={() => setGuests(Math.min(12, guests + 1))}>+</button>
            </div>
          </div>
        </div>
      </div>
      <div className="cc-exact-search-go">
        <button className="cc-exact-btn cc-exact-btn-primary" type="submit">Search</button>
      </div>
    </form>
  );
};

const FilterMenu = ({ label, active, children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="cc-exact-filter-pop" ref={ref}>
      <button type="button" className={`cc-exact-chip ${active ? "on" : ""}`} onClick={() => setOpen((value) => !value)}>
        {label}
      </button>
      <div className={`cc-exact-filter-menu ${open ? "open" : ""}`}>{children}</div>
    </div>
  );
};

const Filters = ({ filters, setFilters }) => {
  const toggleTag = (tag) => {
    setFilters((current) => {
      const tags = new Set(current.tags);
      tags.has(tag) ? tags.delete(tag) : tags.add(tag);
      return { ...current, tags };
    });
  };

  const step = (key, delta, max) => {
    setFilters((current) => ({ ...current, [key]: Math.max(0, Math.min(max, current[key] + delta)) }));
  };

  return (
    <div className="cc-exact-filters">
      <FilterMenu label={`Guests${filters.guests ? ` · ${filters.guests}+` : ""}`} active={filters.guests > 0}>
        <h4>Minimum guests</h4>
        <div className="cc-exact-stepper">
          <span>Guests</span>
          <div>
            <button type="button" onClick={() => step("guests", -1, 12)}>−</button>
            <b>{filters.guests || "Any"}</b>
            <button type="button" onClick={() => step("guests", 1, 12)}>+</button>
          </div>
        </div>
      </FilterMenu>
      <FilterMenu label={`Bedrooms${filters.bedrooms ? ` · ${filters.bedrooms}+` : ""}`} active={filters.bedrooms > 0}>
        <h4>Minimum bedrooms</h4>
        <div className="cc-exact-stepper">
          <span>Bedrooms</span>
          <div>
            <button type="button" onClick={() => step("bedrooms", -1, 6)}>−</button>
            <b>{filters.bedrooms || "Any"}</b>
            <button type="button" onClick={() => step("bedrooms", 1, 6)}>+</button>
          </div>
        </div>
      </FilterMenu>
      <FilterMenu label={`Price${filters.maxPrice ? ` · under ${money(filters.maxPrice)}` : ""}`} active={filters.maxPrice > 0}>
        <h4>Nightly price</h4>
        <input
          type="range"
          min="300"
          max="600"
          step="25"
          value={filters.maxPrice || 600}
          onChange={(event) => setFilters((current) => ({ ...current, maxPrice: Number(event.target.value) === 600 ? 0 : Number(event.target.value) }))}
        />
        <div className="cc-exact-small">Up to <b>{filters.maxPrice ? money(filters.maxPrice) : "any price"}</b> / night</div>
      </FilterMenu>
      {["Pool", "Waterfront", "Pet friendly"].map((tag) => (
        <button key={tag} type="button" className={`cc-exact-chip ${filters.tags.has(tag) ? "on" : ""}`} onClick={() => toggleTag(tag)}>
          {tag}
        </button>
      ))}
      {(filters.destination || filters.guests || filters.bedrooms || filters.maxPrice || filters.tags.size > 0) && (
        <button type="button" className="cc-exact-chip cc-exact-clear" onClick={() => setFilters({ destination: "", guests: 0, bedrooms: 0, maxPrice: 0, tags: new Set() })}>
          Clear all
        </button>
      )}
    </div>
  );
};

const PropertyCard = ({ property }) => {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  const images = (property.images || []).slice(0, 3);

  const scrollBy = (event, direction) => {
    event.preventDefault();
    event.stopPropagation();
    trackRef.current?.scrollBy({ left: direction * trackRef.current.clientWidth, behavior: "smooth" });
  };

  const updateActive = () => {
    const track = trackRef.current;
    if (!track) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  };

  return (
    <a className="cc-exact-p-card" href={property.url} aria-label={`${property.title}, ${property.city}`}>
      <div className="cc-exact-gal">
        {images.length ? (
          <div className="cc-exact-gal-track" ref={trackRef} onScroll={() => requestAnimationFrame(updateActive)}>
            {images.map((src, index) => (
              <img
                className={index === active ? "is-active" : ""}
                src={src}
                alt={`${property.title} photo ${index + 1}`}
                loading="lazy"
                key={src}
              />
            ))}
          </div>
        ) : <Placeholder />}
        {images.length > 1 && (
          <>
            <button className="cc-exact-gal-arrow prev" type="button" onClick={(event) => scrollBy(event, -1)} aria-label="Previous photo">‹</button>
            <button className="cc-exact-gal-arrow next" type="button" onClick={(event) => scrollBy(event, 1)} aria-label="Next photo">›</button>
            <div className="cc-exact-gal-dots" aria-hidden="true">
              {images.map((src, index) => <i className={index === active ? "on" : ""} key={`${src}-${index}`} />)}
            </div>
          </>
        )}
      </div>
      <div className="cc-exact-p-meta">
        <div className="row1">
          <span className="cc-exact-p-name">{property.title}</span>
          {property.rating ? (
            <span className="cc-exact-p-rate"><span>★</span> <b>{Number(property.rating).toFixed(2)}</b></span>
          ) : (
            <span className="cc-exact-p-rate muted">{property.badge || "New to CC Stays"}</span>
          )}
        </div>
        <div className="cc-exact-p-loc">{property.city}{property.region ? `, ${property.region}` : ""}</div>
        <div className="row3">
          <span>{property.guests} guests · {property.bedrooms} bd · {property.bathrooms} ba</span>
          <span className="cc-exact-p-price"><b>{money(property.price)}</b> / night</span>
        </div>
      </div>
    </a>
  );
};

const StaysPage = ({ mountNode }) => {
  const [{ links, images }, setMountData] = useState(() => readMountData(mountNode));
  const [syncedProperties, setSyncedProperties] = useState([]);
  const [filters, setFilters] = useState({ destination: readDestinationQuery(), guests: 0, bedrooms: 0, maxPrice: 0, tags: new Set() });

  useEffect(() => {
    setMountData(readMountData(mountNode));
  }, [mountNode]);

  useEffect(() => {
    fetch("/wp-json/cc-stays/v1/search-stays")
      .then((response) => response.json())
      .then((data) => setSyncedProperties(Array.isArray(data) ? data : []))
      .catch(() => setSyncedProperties([]));
  }, []);

  const properties = useMemo(() => {
    const matchedIds = new Set();
    const featured = FALLBACK_PROPERTIES.map((fallback) => {
      const synced = matchProperty(syncedProperties, fallback) || {};
      if (synced.id) matchedIds.add(synced.id);
      const syncedLocation = splitLocation(synced.city);
      return {
        ...fallback,
        id: synced.id,
        city: synced.city ? syncedLocation.city : fallback.city,
        region: synced.city ? syncedLocation.region : fallback.region,
        guests: numberOr(synced.guests, fallback.guests, 2),
        bedrooms: numberOr(synced.bedrooms, fallback.bedrooms),
        bathrooms: numberOr(synced.bathrooms, fallback.bathrooms),
        price: numberOr(synced.price, fallback.price),
        url: synced.url || links.stays,
        images: uniqueImages(synced.images || [], synced.image, images.propertyImages?.[fallback.key] || []).slice(0, 3),
      };
    });

    const otherSynced = syncedProperties
      .filter((property) => !matchedIds.has(property.id))
      .map((property) => {
        const location = splitLocation(property.city);
        return {
          key: `synced-${property.id || normalize(property.title)}`,
          id: property.id,
          title: property.title,
          city: location.city,
          region: location.region,
          guests: numberOr(property.guests, 2),
          bedrooms: numberOr(property.bedrooms, 1),
          bathrooms: numberOr(property.bathrooms, 1),
          price: numberOr(property.price, 0),
          url: property.url || links.stays,
          images: uniqueImages(property.images || [], property.image).slice(0, 3),
          tags: property.pets ? ["Pet friendly"] : [],
        };
      });

    return [...featured, ...otherSynced];
  }, [images.propertyImages, links.stays, syncedProperties]);

  const filteredProperties = useMemo(() => properties.filter((property) => {
    if (!matchesDestinationQuery(property, filters.destination)) return false;
    if (filters.guests && property.guests < filters.guests) return false;
    if (filters.bedrooms && property.bedrooms < filters.bedrooms) return false;
    if (filters.maxPrice && property.price > filters.maxPrice) return false;
    for (const tag of filters.tags) {
      if (!property.tags?.includes(tag)) return false;
    }
    return true;
  }), [filters, properties]);

  return (
    <main className="cc-exact cc-exact-stays">
      <ExactHeader links={links} />
      <div className="cc-exact-page-pad cc-exact-section-tight">
        <div className="cc-exact-wrap">
          <ExactKick>The Collection</ExactKick>
          <div className="cc-exact-stays-head">
            <h2>Find your <span className="cc-exact-accent">stay.</span></h2>
          </div>
          <SearchBar properties={properties} links={links} onGuestFilter={(guests) => setFilters((current) => ({ ...current, guests }))} />
          <Filters filters={filters} setFilters={setFilters} />
          <div className="cc-exact-stay-grid">
            {filteredProperties.map((property) => <PropertyCard property={property} key={property.key || property.id || property.title} />)}
          </div>
          {!filteredProperties.length && (
            <div className="cc-exact-empty-note">
              <p className="cc-exact-serif">No stays match those filters yet.</p>
              <p>Try widening your dates or clearing a filter, or <a href={links.contact}>ask us</a> and we&apos;ll help you find the right fit.</p>
            </div>
          )}
        </div>
      </div>
      <ExactFooter links={links} />
    </main>
  );
};

export default StaysPage;
