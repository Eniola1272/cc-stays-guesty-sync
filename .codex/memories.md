# CC Stays Project Memories

Source: extracted from the Gemini conversation PDF provided on 2026-07-17.

These are working memories, not gospel. Before changing code, verify the current repo state.

## Product And Routing

- The public properties archive is the real Stays page, and its base path is `/stays`, not `/properties`.
- Homepage search should route to `/stays?...` with query params such as `checkIn`, `checkOut`, `location`, and `guests`.
- Prefer relative URLs for internal property/gallery links, e.g. `/bamboo-bliss-gallery/`, so staging and production domains both work.
- If an absolute gallery URL is required in PHP, store the relative slug in post meta and build with `get_site_url() . $gallery_slug`.

## WordPress And React Architecture

- The plugin is a WordPress/React booking integration centered on `cc-stays-guesty-sync.php`, `src/BookingWidget.jsx`, `src/SearchBar.jsx`, and `src/index.jsx`.
- React components should call WordPress REST routes through relative paths like `/wp-json/cc-stays/v1/...`.
- The archive/stays experience was intended to be one React app so search filters, property grid, and map update together.
- A proposed archive endpoint was `/wp-json/cc-stays/v1/search-stays`, returning property post data, featured image, permalink, city, guests, bedrooms, bathrooms, nightly rate, latitude, and longitude.
- A proposed archive shortcode was `[cc_stays_archive]`, mounting into `#cc-stays-react-archive`.
- Existing booking widget mount reads values from DOM attributes, especially `data-listing-id`, `data-nightly-rate`, and `data-min-nights`.

## Guesty Integration

- Guesty availability should be fetched server-side through the WordPress plugin, then passed to React as blocked date strings.
- The frontend booking calendar uses `react-datepicker` with `excludeDates={blockedDates}` to gray/hash out booked dates.
- Guesty quote requests flow through `/wp-json/cc-stays/v1/quote`.
- Guesty availability requests flow through `/wp-json/cc-stays/v1/availability?listingId=...`.
- Guesty property IDs should not be hardcoded in React; WordPress should provide each listing ID through post meta / shortcode DOM attributes.
- The admin sync action/button is expected to resync Guesty listings and update `guesty_listing_id` fields for properties.
- Guesty access tokens may be cached in a WordPress transient named `guesty_access_token` for about 23 hours. After changing API credentials, delete this transient or purge object cache before testing.
- For `auth_failed` / 500 errors, likely causes include missing API credentials after migration, stale token transients, host outbound cURL issues, or Guesty rejecting credentials.
- Helpful debug behavior: distinguish `is_wp_error($response)` server errors from non-200 Guesty responses and include the response code/body during diagnosis. Avoid exposing raw secrets in production UI.

## Hosting And Migration

- Staging domains mentioned in the thread included Hostinger and Pantheon, including `dev-cc-stays.pantheonsite.io` and `indigo-hawk-918016.hostingersite.com` and `sienna-goose-738572.hostingersite.com`.
- Domain changes should not break React fetches if all site calls use relative URLs.
- After moving hosts/domains, flush WordPress permalinks by visiting Settings > Permalinks and clicking Save Changes.
- On Hostinger, purge LiteSpeed cache and consider toggling Object Cache while debugging Guesty auth.
- Ensure live domains use HTTPS. Stripe and Guesty integrations should be treated as HTTPS-only for reliable production behavior.
- Update Stripe/Guesty webhook URLs after domain migration if webhooks are configured.

## Dependencies

- The project was on React 18.3.1 during the Gemini thread.
- `react-leaflet@5` requires React 19, so if Leaflet is needed while staying on React 18, install `leaflet react-leaflet@4`.
- Do not upgrade the whole React runtime just to satisfy map dependencies unless there is a separate reason.

## Design Direction

- Brand feel: premium, luxury hospitality, editorial, calm, boutique, high-end but usable.
- Primary green seen throughout: `#3b5240`; hover green: `#2c3e30`.
- Serif display typography should be used for premium headings such as price lines and calendar month labels, via `var(--cc-font-serif)` when available.
- Sans typography should use `var(--cc-font-sans)` when available.
- Avoid emoji icons in the production interface. Use clean SVG/lucide-style icons instead.

## Homepage Search Bar

- The client wants an Airbnb-style floating pill search bar on the homepage.
- Desktop structure: Where, When, Who, separated by vertical dividers, with a dark green Search button on the right.
- Search bar labels should be compact and clear; input chrome should be minimal.
- `react-datepicker` input should use a borderless class like `.cc-minimal-datepicker`.
- Mobile search should stack vertically inside a white bordered container, with the Search button full-width at the bottom.

## Stays Archive Page

- Desktop layout goal: split-screen archive with property grid on the left and sticky map on the right.
- Include a Hide Map / Show Map control; when map is hidden, the grid should expand.
- Mobile layout goal: single-column property cards; hide the sticky map or move it behind a map toggle/modal.
- Property cards should include image, serif title, location row, short description, and a button whose text remains `VIEW STAYS`.
- Mobile cards should stack as `grid-template-columns: 1fr`.
- Do not break `react-datepicker` or `react-leaflet` logic while doing design-only responsive updates.

## Booking Widget

- Core functionality to preserve: date range state, Guesty availability fetch, blocked date conversion, guest selector, quote request, checkout redirect, loading/error/quote states.
- The widget should visually match a luxury booking card:
  - White card, subtle border, soft shadow, generous padding.
  - Price line like `From $475 avg / night` in large serif type.
  - Muted minimum-stay text.
  - Check-in and check-out displayed in a unified bordered 50/50 container with a vertical divider.
  - Labels uppercase, tiny, bold, and muted.
  - Inline calendar blended into the card with minimal DatePicker chrome.
  - Calendar month header centered in serif type.
  - Disabled days gray and struck/visually unavailable.
  - Guest selector styled like the date boxes.
  - CTA full-width dark green with white text.
- The mockup from the user shows this exact visual direction: a right-side card with price header, minimum stay, split check-in/check-out boxes, and an inline July 2026 calendar.

## CSS Snippets Remembered From Gemini

Useful variables:

```css
:root {
  --cc-green: #3b5240;
  --cc-green-hover: #2c3e30;
  --cc-border: #ebebeb;
  --cc-text-dark: #222222;
  --cc-text-muted: #717171;
  --cc-font-serif: "Georgia", serif;
  --cc-font-sans: "Helvetica Neue", Arial, sans-serif;
}
```

Minimal datepicker input:

```css
.cc-minimal-datepicker {
  border: none !important;
  outline: none !important;
  background: transparent !important;
  color: #717171 !important;
  font-size: 14px !important;
  padding: 0 !important;
  box-shadow: none !important;
}
```

## Collaboration Preferences

- The user wants continuity from Gemini's work and expects the assistant to remember prior design/architecture decisions.
- When implementing design changes, protect working booking/Guesty logic first.
- Prefer concrete code changes in the current repo over generic prompts to another assistant.
