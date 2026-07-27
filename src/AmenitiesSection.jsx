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
  if (/hair dryer/.test(label)) return "hairDryer";
  if (/cleaning products/.test(label)) return "cleaning";
  if (/shampoo|conditioner|soap|shower gel/.test(label)) return "bottle";
  if (/hot water/.test(label)) return "hotWater";
  if (/dryer/.test(label)) return "dryer";
  if (/hanger/.test(label)) return "hanger";
  if (/bed linen/.test(label)) return "bed";
  if (/pillow|blanket/.test(label)) return "pillow";
  if (/iron/.test(label)) return "iron";
  if (/clothing|closet|storage/.test(label)) return "closet";
  if (/ethernet/.test(label)) return "ethernet";
  if (/pool table|ping pong/.test(label)) return "gameTable";
  if (/book|reading/.test(label)) return "book";
  if (/theme room|arcade|life size games/.test(label)) return "arcade";
  if (/mini golf/.test(label)) return "golf";
  if (/crib|travel crib/.test(label)) return "crib";
  if (/high chair/.test(label)) return "highChair";
  if (/children's dinnerware|childrens dinnerware/.test(label)) return "kidsPlate";
  if (/board game/.test(label)) return "boardGame";
  if (/ceiling fan|portable fans|fan/.test(label)) return "fan";
  if (/heating/.test(label)) return "heating";
  if (/exterior security cameras|camera/.test(label)) return "camera";
  if (/smoke alarm/.test(label)) return "smokeAlarm";
  if (/carbon monoxide/.test(label)) return "carbonAlarm";
  if (/fire extinguisher/.test(label)) return "fireExtinguisher";
  if (/first aid/.test(label)) return "firstAid";
  if (/refrigerator/.test(label)) return "fridge";
  if (/microwave/.test(label)) return "microwave";
  if (/dishwasher/.test(label)) return "dishwasher";
  if (/stove/.test(label)) return "stove";
  if (/oven/.test(label)) return "oven";
  if (/kettle/.test(label)) return "kettle";
  if (/coffee maker|coffee/.test(label)) return "coffee";
  if (/wine glass/.test(label)) return "wine";
  if (/toaster/.test(label)) return "toaster";
  if (/baking sheet/.test(label)) return "baking";
  if (/blender/.test(label)) return "blender";
  if (/barbecue utensils/.test(label)) return "utensils";
  if (/dining table/.test(label)) return "diningTable";
  if (/private entrance/.test(label)) return "door";
  if (/laundromat/.test(label)) return "laundromat";
  if (/patio|balcony/.test(label)) return "balcony";
  if (/outdoor furniture/.test(label)) return "outdoorChair";
  if (/outdoor dining/.test(label)) return "outdoorDining";
  if (/bbq|grill/.test(label)) return "grill";
  if (/beach essentials|beach/.test(label)) return "beach";
  if (/sun lounger/.test(label)) return "sunLounger";
  if (/hot tub/.test(label)) return "hotTub";
  if (/fire pit/.test(label)) return "firePit";
  if (/luggage/.test(label)) return "luggage";
  if (/long term/.test(label)) return "calendar";
  if (/housekeeping/.test(label)) return "housekeeping";
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
    case "hairDryer":
      return <svg {...common}><path d="M5 13a5 5 0 0 1 5-5h13a4 4 0 0 1 0 8H10a5 5 0 0 1-5-3Z" /><circle cx="10" cy="12" r="1.7" /><path d="M15 16l-2 11h5l3-11" /><path d="M27 10l2-2" /><path d="M28 14h3" /></svg>;
    case "cleaning":
      return <svg {...common}><path d="M13 5h6l1 5H12l1-5Z" /><path d="M9 10h14v16a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3V10Z" /><path d="M9 16h14" /><path d="M12 21h8" /></svg>;
    case "bottle":
      return <svg {...common}><path d="M13 3h6v4l-2 2v2h-2V9l-2-2V3Z" /><path d="M11 13h10v14a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V13Z" /><path d="M11 19h10" /><path d="M14 24h4" /></svg>;
    case "hotWater":
      return <svg {...common}><path d="M7 18h18v6a5 5 0 0 1-5 5h-8a5 5 0 0 1-5-5v-6Z" /><path d="M10 18v-6" /><path d="M16 18v-6" /><path d="M22 18v-6" /><path d="M10 4c-2 2-2 4 0 6" /><path d="M16 4c-2 2-2 4 0 6" /><path d="M22 4c-2 2-2 4 0 6" /></svg>;
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
    case "dryer":
      return <svg {...common}><rect x="8" y="4" width="16" height="24" rx="2" /><circle cx="16" cy="17" r="6" /><path d="M13 15c2-2 4 2 6 0" /><path d="M13 19c2-2 4 2 6 0" /><circle cx="20" cy="8" r="1" fill="currentColor" stroke="none" /></svg>;
    case "hanger":
      return <svg {...common}><path d="M16 11V9a3 3 0 1 1 3 3" /><path d="M16 13 6 24a2 2 0 0 0 1.5 3h17a2 2 0 0 0 1.5-3L16 13Z" /></svg>;
    case "bed":
      return <svg {...common}><path d="M5 13V7" /><path d="M27 20v-4a5 5 0 0 0-5-5H12a5 5 0 0 0-5 5v4" /><path d="M5 20h22" /><path d="M7 25v-5" /><path d="M25 25v-5" /><path d="M10 11V9h6v2" /></svg>;
    case "pillow":
      return <svg {...common}><path d="M8 10c1.5-2 14.5-2 16 0 2 2.5 2 9.5 0 12-1.5 2-14.5 2-16 0-2-2.5-2-9.5 0-12Z" /><path d="M11 13c2 1 8 1 10 0" /></svg>;
    case "iron":
      return <svg {...common}><path d="M8 20h18a3 3 0 0 1 3 3v3H9a6 6 0 0 1-6-6h5Z" /><path d="M10 20V9h9a5 5 0 0 1 5 5v6" /><path d="M13 13h5" /></svg>;
    case "closet":
      return <svg {...common}><rect x="8" y="4" width="16" height="24" rx="2" /><path d="M16 4v24" /><path d="M13 16h.1" /><path d="M19 16h.1" /></svg>;
    case "ethernet":
      return <svg {...common}><rect x="10" y="5" width="12" height="8" rx="1.5" /><path d="M16 13v6" /><path d="M8 27v-5h16v5" /><path d="M5 27h6" /><path d="M13 27h6" /><path d="M21 27h6" /></svg>;
    case "snow":
      return <svg {...common}><path d="M16 4v24" /><path d="M7 9l18 14" /><path d="M25 9 7 23" /><path d="M12 6l4 4 4-4" /><path d="M12 26l4-4 4 4" /></svg>;
    case "fan":
      return <svg {...common}><circle cx="16" cy="16" r="2" /><path d="M16 14c-1-5 2-9 5-9 2 0 3 2 2 4-1 3-4 4-7 5Z" /><path d="M18 17c5-1 9 2 9 5 0 2-2 3-4 2-3-1-4-4-5-7Z" /><path d="M14 18c-5 1-9-2-9-5 0-2 2-3 4-2 3 1 4 4 5 7Z" /></svg>;
    case "heating":
      return <svg {...common}><path d="M16 29c-5 0-8-3-8-7 0-3 2-5 4-7 2-2 3-5 2-9 5 3 9 7 9 13 1-1 2-3 2-5 2 2 3 5 3 8 0 4-3 7-8 7Z" /><path d="M16 29c-2 0-4-2-4-4 0-2 1-3 3-5 3 2 5 4 5 6 0 2-2 3-4 3Z" /></svg>;
    case "safety":
      return <svg {...common}><path d="M6 10h13v11H6z" /><path d="M19 14l7-4v11l-7-4" /><circle cx="10" cy="25" r="2" /><path d="M10 21v2" /></svg>;
    case "camera":
      return <svg {...common}><path d="M5 10h14v12H5z" /><path d="M19 14l8-4v12l-8-4" /><circle cx="10" cy="25" r="2" /><path d="M10 22v1" /></svg>;
    case "smokeAlarm":
      return <svg {...common}><circle cx="16" cy="12" r="7" /><path d="M10 22h12" /><path d="M12 27h8" /><path d="M12 12h8" /><path d="M16 8v8" /></svg>;
    case "carbonAlarm":
      return <svg {...common}><rect x="7" y="6" width="18" height="20" rx="3" /><circle cx="16" cy="16" r="5" /><path d="M13 16h6" /><path d="M16 13v6" /></svg>;
    case "fireExtinguisher":
      return <svg {...common}><path d="M14 4h6v4h-6z" /><path d="M17 8v4" /><path d="M12 13h10v14a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V13Z" /><path d="M10 8h4" /><path d="M20 5l5 4" /><path d="M12 20h10" /></svg>;
    case "firstAid":
      return <svg {...common}><rect x="6" y="9" width="20" height="17" rx="2" /><path d="M12 9V6h8v3" /><path d="M16 14v7" /><path d="M12.5 17.5h7" /></svg>;
    case "fridge":
      return <svg {...common}><rect x="10" y="3" width="12" height="26" rx="2" /><path d="M10 13h12" /><path d="M14 8v2" /><path d="M14 18v4" /></svg>;
    case "microwave":
      return <svg {...common}><rect x="4" y="9" width="24" height="15" rx="2" /><rect x="8" y="12" width="12" height="9" rx="1" /><path d="M24 13h.1" /><path d="M24 17h.1" /><path d="M24 21h.1" /></svg>;
    case "dishwasher":
      return <svg {...common}><rect x="8" y="5" width="16" height="22" rx="2" /><path d="M8 11h16" /><path d="M12 8h.1" /><path d="M16 8h.1" /><path d="M12 17l3 3 5-6" /></svg>;
    case "stove":
      return <svg {...common}><rect x="6" y="8" width="20" height="18" rx="2" /><circle cx="12" cy="14" r="2" /><circle cx="20" cy="14" r="2" /><path d="M10 22h12" /><path d="M10 4h12" /></svg>;
    case "oven":
      return <svg {...common}><rect x="6" y="5" width="20" height="23" rx="2" /><path d="M6 11h20" /><path d="M11 8h.1" /><path d="M16 8h.1" /><path d="M21 8h.1" /><rect x="10" y="15" width="12" height="8" rx="1" /></svg>;
    case "kettle":
      return <svg {...common}><path d="M9 13h13v9a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6v-9Z" /><path d="M22 15h2a4 4 0 0 1 0 8h-2" /><path d="M9 14 5 10h4" /><path d="M12 5c-1 2-1 3 0 5" /><path d="M17 5c-1 2-1 3 0 5" /></svg>;
    case "coffee":
      return <svg {...common}><path d="M8 12h13v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6v-8Z" /><path d="M21 14h2a4 4 0 0 1 0 8h-2" /><path d="M11 6c-1 2-1 3 0 5" /><path d="M16 6c-1 2-1 3 0 5" /></svg>;
    case "wine":
      return <svg {...common}><path d="M11 4h10l-1 9a4 4 0 0 1-8 0L11 4Z" /><path d="M16 17v9" /><path d="M11 28h10" /><path d="M12 10h8" /></svg>;
    case "toaster":
      return <svg {...common}><path d="M8 14h16a4 4 0 0 1 4 4v7H4v-7a4 4 0 0 1 4-4Z" /><path d="M11 14V8h10v6" /><path d="M7 25v3" /><path d="M25 25v3" /><path d="M9 20h10" /><path d="M24 17v5" /></svg>;
    case "baking":
      return <svg {...common}><rect x="5" y="9" width="22" height="16" rx="2" /><path d="M9 13h14" /><path d="M9 17h14" /><path d="M9 21h14" /></svg>;
    case "blender":
      return <svg {...common}><path d="M11 4h9l-1 11h-7L11 4Z" /><path d="M12 15h8l2 10H10l2-10Z" /><path d="M13 28h6" /><path d="M14 8h4" /></svg>;
    case "utensils":
      return <svg {...common}><path d="M7 5v10" /><path d="M11 5v10" /><path d="M9 5v24" /><path d="M20 5c4 2 6 6.5 6 12h-6v12" /></svg>;
    case "diningTable":
      return <svg {...common}><path d="M7 13h18" /><path d="M10 13v14" /><path d="M22 13v14" /><path d="M5 9h22" /><path d="M8 5h16" /></svg>;
    case "bath":
      return <svg {...common}><path d="M10 5h9v5h1a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4V7a2 2 0 0 1 2-2" /><path d="M10 18h12" /><path d="M14 5V3h6" /></svg>;
    case "outdoor":
      return <svg {...common}><path d="M4 16h24" /><path d="M16 4v24" /><path d="M6 16a10 10 0 0 1 20 0" /><path d="M8 24h6" /><path d="M18 24h6" /></svg>;
    case "door":
      return <svg {...common}><path d="M11 28V5h12v23" /><path d="M7 28h20" /><path d="M19 17h.1" /><path d="M11 5 7 8v20" /></svg>;
    case "laundromat":
      return <svg {...common}><rect x="6" y="5" width="20" height="22" rx="2" /><path d="M6 11h20" /><circle cx="16" cy="19" r="5" /><path d="M13 19a6 6 0 0 0 6 0" /><path d="M10 8h.1" /><path d="M14 8h.1" /></svg>;
    case "balcony":
      return <svg {...common}><path d="M8 5h16v11H8z" /><path d="M5 20h22" /><path d="M7 20v8" /><path d="M12 20v8" /><path d="M17 20v8" /><path d="M22 20v8" /><path d="M27 20v8" /></svg>;
    case "outdoorChair":
      return <svg {...common}><path d="M10 6h12l-2 12H12L10 6Z" /><path d="M12 18h10" /><path d="M13 18l-3 10" /><path d="M21 18l3 10" /></svg>;
    case "outdoorDining":
      return <svg {...common}><path d="M6 15h20" /><path d="M10 15v13" /><path d="M22 15v13" /><path d="M16 5v23" /><path d="M8 10a8 8 0 0 1 16 0" /></svg>;
    case "grill":
      return <svg {...common}><path d="M8 14h16a8 8 0 0 1-16 0Z" /><path d="M6 14h20" /><path d="M12 22l-4 6" /><path d="M20 22l4 6" /><path d="M16 22v6" /><path d="M12 5c-1 2-1 4 0 6" /><path d="M17 5c-1 2-1 4 0 6" /></svg>;
    case "beach":
      return <svg {...common}><path d="M4 17a12 12 0 0 1 24 0H4Z" /><path d="M16 17v11" /><path d="M11 28h10" /><path d="M16 5c2 3 3 7 3 12" /><path d="M16 5c-2 3-3 7-3 12" /></svg>;
    case "sunLounger":
      return <svg {...common}><path d="M6 23h20" /><path d="M9 23l5-12h9l-5 12" /><path d="M19 23l6 5" /><path d="M8 23l-3 5" /><circle cx="23" cy="8" r="3" /><path d="M23 2v2" /><path d="M23 12v2" /><path d="M17 8h2" /><path d="M27 8h2" /></svg>;
    case "hotTub":
      return <svg {...common}><path d="M5 16h22v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-8Z" /><path d="M8 16v-4" /><path d="M14 16v-4" /><path d="M20 16v-4" /><path d="M9 5c-1 2-1 3 0 5" /><path d="M16 5c-1 2-1 3 0 5" /><path d="M23 5c-1 2-1 3 0 5" /></svg>;
    case "firePit":
      return <svg {...common}><path d="M6 24h20" /><path d="M9 24c0-5 3-7 5-10 1-2 2-4 1-8 5 3 8 7 8 12 1-1 2-3 2-5 2 2 3 5 3 8 0 2-1 3-2 3" /><path d="M12 24c0-3 2-5 4-7 3 2 5 4 5 7" /></svg>;
    case "luggage":
      return <svg {...common}><rect x="8" y="9" width="16" height="17" rx="2" /><path d="M12 9V6h8v3" /><path d="M12 13v9" /><path d="M20 13v9" /><path d="M12 29v-3" /><path d="M20 29v-3" /></svg>;
    case "calendar":
      return <svg {...common}><rect x="5" y="7" width="22" height="20" rx="2" /><path d="M10 4v6" /><path d="M22 4v6" /><path d="M5 13h22" /><path d="M11 18h4" /><path d="M18 18h4" /><path d="M11 23h4" /></svg>;
    case "housekeeping":
      return <svg {...common}><path d="M8 27h16" /><path d="M12 27l3-16h2l3 16" /><path d="M11 11h10" /><path d="M14 7h4" /><path d="M22 5l1 3" /><path d="M26 7l-3 1" /><path d="M7 8l2 2" /><path d="M9 6 7 8" /></svg>;
    case "gameTable":
      return <svg {...common}><path d="M6 14h20v6H6z" /><path d="M8 20v8" /><path d="M24 20v8" /><circle cx="12" cy="17" r="1" /><circle cx="20" cy="17" r="1" /><path d="M15 10h2" /></svg>;
    case "book":
      return <svg {...common}><path d="M6 6h9a4 4 0 0 1 4 4v18a4 4 0 0 0-4-4H6V6Z" /><path d="M19 10a4 4 0 0 1 4-4h3v18h-3a4 4 0 0 0-4 4" /></svg>;
    case "arcade":
      return <svg {...common}><rect x="6" y="8" width="20" height="16" rx="3" /><path d="M11 16h6" /><path d="M14 13v6" /><circle cx="21" cy="15" r="1" fill="currentColor" stroke="none" /><circle cx="23" cy="19" r="1" fill="currentColor" stroke="none" /></svg>;
    case "golf":
      return <svg {...common}><path d="M12 28h9a4 4 0 0 0 0-8h-4" /><circle cx="22" cy="28" r="1" fill="currentColor" stroke="none" /><path d="M12 28 20 4" /><path d="M20 4l6 3-7 3" /></svg>;
    case "crib":
      return <svg {...common}><path d="M6 12h20v12H6z" /><path d="M9 12V8" /><path d="M23 12V8" /><path d="M10 24v4" /><path d="M22 24v4" /><path d="M10 16v5" /><path d="M15 16v5" /><path d="M20 16v5" /></svg>;
    case "highChair":
      return <svg {...common}><path d="M13 5h8v8h-8z" /><path d="M11 13h13" /><path d="M15 13l-4 15" /><path d="M21 13l4 15" /><path d="M12 21h11" /></svg>;
    case "kidsPlate":
      return <svg {...common}><circle cx="16" cy="16" r="8" /><circle cx="13" cy="14" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="14" r="1" fill="currentColor" stroke="none" /><path d="M12 19c2 2 6 2 8 0" /><path d="M5 27l5-5" /><path d="M27 27l-5-5" /></svg>;
    case "boardGame":
      return <svg {...common}><rect x="6" y="6" width="20" height="20" rx="2" /><path d="M6 16h20" /><path d="M16 6v20" /><circle cx="11" cy="11" r="1" fill="currentColor" stroke="none" /><circle cx="21" cy="21" r="1" fill="currentColor" stroke="none" /><path d="M20 10h3v3h-3z" /><path d="M9 20h3v3H9z" /></svg>;
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
    <section className="cc-amenities-section" aria-label="What this place offers">
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
