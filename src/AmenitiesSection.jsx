import React, { useEffect, useMemo, useState } from "react";
import "./AmenitiesSection.css";

const DEFAULT_AMENITY_GROUPS = [
  {
    title: "Bathroom",
    items: ["Hair dryer", "Cleaning products", "Shampoo", "Conditioner", "Body soap", "Hot water", "Shower gel"],
  },
  {
    title: "Bedroom and laundry",
    items: ["Washer", "Dryer", "Hangers", "Bed linens", "Extra pillows and blankets", "Iron", "Clothing storage: closet", "Ethernet connection"],
  },
  {
    title: "Entertainment",
    items: ["TV", "Pool table", "Books and reading material", "Theme room", "Life size games", "Mini golf"],
  },
  {
    title: "Family",
    items: ["Pack 'n play/Travel crib", "Standalone high chair - always at the listing", "Children's dinnerware", "Board games"],
  },
  {
    title: "Heating and cooling",
    items: ["Air conditioning", "Ceiling fan", "Portable fans", "Heating"],
  },
  {
    title: "Home safety",
    items: ["Exterior security cameras on property", "Smoke alarm", "Carbon monoxide alarm", "Fire extinguisher", "First aid kit"],
  },
  {
    title: "Internet and office",
    items: ["Wifi", "Dedicated workspace"],
  },
  {
    title: "Kitchen and dining",
    items: ["Kitchen", "Refrigerator", "Microwave", "Cooking basics", "Dishes and silverware", "Dishwasher", "Stove", "Oven", "Hot water kettle", "Coffee maker", "Wine glasses", "Toaster", "Baking sheet", "Blender", "Barbecue utensils", "Dining table", "Coffee"],
  },
  {
    title: "Location features",
    items: ["Private entrance", "Laundromat nearby"],
  },
  {
    title: "Outdoor",
    items: ["Private patio or balcony", "Outdoor furniture", "Outdoor dining area", "BBQ grill", "Beach essentials", "Sun loungers"],
  },
  {
    title: "Parking and facilities",
    items: ["Free parking garage on premises", "Pool"],
  },
  {
    title: "Services",
    items: ["Luggage dropoff allowed", "Long term stays allowed", "Housekeeping available 24 hours, every day - available at extra cost"],
  },
];

const PREVIEW_NAMES = [
  "Kitchen",
  "Wifi",
  "Dedicated workspace",
  "Free parking garage on premises",
  "Pool",
  "TV",
  "Washer",
  "Dryer",
  "Air conditioning",
  "Exterior security cameras on property",
];

const CATEGORY_RULES = [
  ["Bathroom", /hair|shampoo|conditioner|soap|shower|bath|toilet|towel|hot water/i],
  ["Bedroom and laundry", /washer|dryer|hanger|linen|pillow|blanket|iron|clothing|closet|laundry/i],
  ["Entertainment", /tv|television|game|arcade|pool table|ping pong|book|mini golf|theme/i],
  ["Family", /crib|child|children|high chair|baby|board game/i],
  ["Heating and cooling", /air conditioning|ac\b|heating|fan|ceiling fan|cool/i],
  ["Home safety", /camera|alarm|smoke|carbon|fire extinguisher|first aid|safety/i],
  ["Internet and office", /wifi|wi-fi|internet|workspace|ethernet|desk/i],
  ["Kitchen and dining", /kitchen|refrigerator|microwave|cooking|dish|silverware|dishwasher|stove|oven|kettle|coffee|wine|toaster|baking|blender|barbecue|dining/i],
  ["Location features", /entrance|laundromat|beach access|lake|waterfront|private/i],
  ["Outdoor", /patio|balcony|outdoor|bbq|grill|beach|sun lounger|fire pit|hot tub/i],
  ["Parking and facilities", /parking|garage|pool|gym|facility/i],
  ["Services", /luggage|long term|housekeeping|cleaning available/i],
];

const normalizeLabel = (label) => String(label || "").replace(/^Unavailable:\s*/i, "").trim();

const titleCaseCategory = (value) => {
  if (!value) return "";
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
};

const inferCategory = (name) => {
  const match = CATEGORY_RULES.find(([, pattern]) => pattern.test(name));
  return match ? match[0] : "Other amenities";
};

const asAmenity = (item) => {
  if (typeof item === "string") {
    return {
      name: normalizeLabel(item),
      description: "",
      category: inferCategory(item),
      unavailable: /^Unavailable:/i.test(item),
    };
  }

  const rawName = item?.name || item?.title || item?.label || item?.amenity || item?.value || "";
  const name = normalizeLabel(rawName);

  return {
    name,
    description: item?.description || item?.subtitle || item?.details || "",
    category: titleCaseCategory(item?.category || item?.group || item?.section) || inferCategory(name),
    unavailable: Boolean(item?.unavailable || item?.isUnavailable || /^Unavailable:/i.test(rawName)),
  };
};

const parseAmenities = (rawAmenities) => {
  if (!rawAmenities) return [];

  try {
    const parsed = JSON.parse(rawAmenities);
    if (Array.isArray(parsed)) return parsed.map(asAmenity).filter((item) => item.name);
    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed).flatMap(([category, items]) => {
        if (!Array.isArray(items)) return [];
        return items.map((item) => ({ ...asAmenity(item), category: titleCaseCategory(category) || asAmenity(item).category }));
      }).filter((item) => item.name);
    }
  } catch (error) {
    return rawAmenities
      .split(/[\n,]+/)
      .map(asAmenity)
      .filter((item) => item.name);
  }

  return [];
};

const getDefaultAmenities = () =>
  DEFAULT_AMENITY_GROUPS.flatMap((group) =>
    group.items.map((item) => ({
      name: item,
      description: item === "Beach essentials" ? "Beach towels, umbrella, beach blanket, snorkeling gear" : "",
      category: group.title,
      unavailable: false,
    })),
  );

const groupAmenities = (amenities) => {
  const groups = new Map();
  amenities.forEach((item) => {
    const category = item.category || inferCategory(item.name);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(item);
  });

  return Array.from(groups.entries()).map(([title, items]) => ({ title, items }));
};

const getIconType = (name) => {
  const label = name.toLowerCase();
  if (/wifi|internet/.test(label)) return "wifi";
  if (/kitchen|dish|silverware|dining|cooking|stove|oven|coffee|toaster|kettle|refrigerator|microwave|blender|wine/.test(label)) return "kitchen";
  if (/workspace|desk|office/.test(label)) return "workspace";
  if (/parking|garage|car/.test(label)) return "parking";
  if (/pool/.test(label)) return "pool";
  if (/tv|television/.test(label)) return "tv";
  if (/washer|dryer|laundry/.test(label)) return "washer";
  if (/air conditioning|heating|fan|cool/.test(label)) return "snow";
  if (/camera|alarm|safety|fire|first aid|carbon|smoke/.test(label)) return "safety";
  if (/hair|shampoo|conditioner|soap|shower|bath|water/.test(label)) return "bath";
  if (/patio|balcony|outdoor|grill|bbq|beach|sun|fire pit|hot tub/.test(label)) return "outdoor";
  if (/crib|child|children|family|game/.test(label)) return "family";
  return "spark";
};

const AmenityIcon = ({ name }) => {
  const type = getIconType(name);
  const common = {
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.9",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  switch (type) {
    case "wifi":
      return <svg {...common}><path d="M5 13.5a16 16 0 0 1 22 0" /><path d="M9.5 18a9.5 9.5 0 0 1 13 0" /><path d="M14 22.5a3 3 0 0 1 4 0" /><circle cx="16" cy="26" r="1.2" fill="currentColor" stroke="none" /></svg>;
    case "kitchen":
      return <svg {...common}><path d="M8 4v24" /><path d="M4 4v7a4 4 0 0 0 8 0V4" /><path d="M21 4v24" /><path d="M21 4c4 2 6 6.5 6 12h-6" /></svg>;
    case "workspace":
      return <svg {...common}><path d="M6 15h20v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V15Z" /><path d="M10 15v-4h12v4" /><path d="M12 8l2-4h4l2 4" /></svg>;
    case "parking":
      return <svg {...common}><path d="M7 15h18l-2-6H9l-2 6Z" /><path d="M7 15a3 3 0 0 0-3 3v6h24v-6a3 3 0 0 0-3-3" /><circle cx="9" cy="20" r="1.4" /><circle cx="23" cy="20" r="1.4" /><path d="M8 24v3H5v-3" /><path d="M27 24v3h-3v-3" /></svg>;
    case "pool":
      return <svg {...common}><path d="M5 20c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5" /><path d="M5 25c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5" /><path d="M13 16V8a4 4 0 0 1 8 0" /><path d="M13 11h10" /></svg>;
    case "tv":
      return <svg {...common}><rect x="5" y="8" width="22" height="14" rx="2" /><path d="M13 27h6" /><path d="M16 22v5" /></svg>;
    case "washer":
      return <svg {...common}><rect x="8" y="4" width="16" height="24" rx="2" /><circle cx="16" cy="17" r="6" /><path d="M12 17a7 7 0 0 0 8 0" /><path d="M12 8h2" /></svg>;
    case "snow":
      return <svg {...common}><path d="M16 4v24" /><path d="M7 9l18 14" /><path d="M25 9 7 23" /><path d="M12 6l4 4 4-4" /><path d="M12 26l4-4 4 4" /></svg>;
    case "safety":
      return <svg {...common}><path d="M6 10h13v11H6z" /><path d="M19 14l7-4v11l-7-4" /><circle cx="10" cy="25" r="2" /><path d="M10 21v2" /></svg>;
    case "bath":
      return <svg {...common}><path d="M10 5h9v5h1a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4V7a2 2 0 0 1 2-2" /><path d="M10 18h12" /><path d="M14 5V3h6" /></svg>;
    case "outdoor":
      return <svg {...common}><path d="M4 16h24" /><path d="M16 4v24" /><path d="M6 16a10 10 0 0 1 20 0" /><path d="M8 24h6" /><path d="M18 24h6" /></svg>;
    case "family":
      return <svg {...common}><circle cx="11" cy="10" r="3" /><circle cx="22" cy="11" r="2.5" /><path d="M5 25v-3a6 6 0 0 1 12 0v3" /><path d="M17 25v-2a5 5 0 0 1 9-3" /></svg>;
    default:
      return <svg {...common}><path d="M16 4l3.2 7.4L27 14.5l-7.3 3.4L16 26l-3.7-8.1L5 14.5l7.8-3.1L16 4Z" /></svg>;
  }
};

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const AmenitiesSection = ({ mountNode }) => {
  const rawAmenities = mountNode?.getAttribute("data-amenities") || "";
  const [modalOpen, setModalOpen] = useState(false);

  const amenities = useMemo(() => {
    const parsed = parseAmenities(rawAmenities);
    return parsed.length ? parsed : getDefaultAmenities();
  }, [rawAmenities]);

  const groups = useMemo(() => groupAmenities(amenities), [amenities]);
  const previewAmenities = useMemo(() => {
    const byName = new Map(amenities.map((item) => [item.name.toLowerCase(), item]));
    const preferred = PREVIEW_NAMES.map((name) => byName.get(name.toLowerCase())).filter(Boolean);
    const remaining = amenities.filter((item) => !preferred.some((preview) => preview.name === item.name));
    return [...preferred, ...remaining].slice(0, 10);
  }, [amenities]);

  useEffect(() => {
    if (!modalOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setModalOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalOpen]);

  return (
    <section className="cc-amenities-section" aria-labelledby="cc-amenities-title">
      <h2 id="cc-amenities-title">What this place offers</h2>

      <div className="cc-amenities-preview">
        {previewAmenities.map((item) => (
          <div className="cc-amenity-preview-item" key={`${item.category}-${item.name}`}>
            <AmenityIcon name={item.name} />
            <span>{item.name}</span>
          </div>
        ))}
      </div>

      <button type="button" className="cc-amenities-show-all" onClick={() => setModalOpen(true)}>
        Show all {amenities.length} amenities
      </button>

      {modalOpen && (
        <div className="cc-amenities-modal-layer" role="presentation">
          <div className="cc-amenities-backdrop" onClick={() => setModalOpen(false)} />
          <div className="cc-amenities-dialog" role="dialog" aria-label="What this place offers" aria-modal="true">
            <div className="cc-amenities-dialog-header">
              <button type="button" className="cc-amenities-close" aria-label="Close" onClick={() => setModalOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="cc-amenities-dialog-body">
              <h2>What this place offers</h2>
              {groups.map((group) => (
                <section className="cc-amenities-group" key={group.title}>
                  <h3>{group.title}</h3>
                  <ul aria-label={group.title}>
                    {group.items.map((item) => (
                      <li className={item.unavailable ? "is-unavailable" : ""} key={`${group.title}-${item.name}`}>
                        <AmenityIcon name={item.name} />
                        <div>
                          <span>{item.name}</span>
                          {item.description && <p>{item.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AmenitiesSection;
