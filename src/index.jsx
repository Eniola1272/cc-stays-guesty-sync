import React from "react";
import { createRoot } from "react-dom/client";
import BookingWidget from "./BookingWidget";
import AvailabilityCalendar from "./AvailabilityCalendar";
import CheckoutForm from "./CheckoutForm";
import SearchBar from "./SearchBar";
import StaysPage from "./StaysPage";
import AmenitiesSection from "./AmenitiesSection";
import HomePageSections from "./HomePageSections";
import HomePageCoastal from "./HomePageCoastal";
import HomePageRevamp from "./HomePageRevamp";
import { AboutPage, ContactPage, DestinationsPage, ExperiencesPage, JournalPage } from "./InteriorPages";
import { DEFAULT_EXACT_LINKS, ExactFooter, ExactHeader } from "./ExactLayout";
import "./PropertySections.css";

const readExactLinks = (mountNode) => {
  if (!mountNode?.dataset?.links) return DEFAULT_EXACT_LINKS;

  try {
    return {
      ...DEFAULT_EXACT_LINKS,
      ...JSON.parse(mountNode.dataset.links),
    };
  } catch {
    return DEFAULT_EXACT_LINKS;
  }
};

// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", () => {
  // 1. Mount Booking Widget
  const bookingElement = document.getElementById("cc-stays-react-booking");
  if (bookingElement) {
    const bookingRoot = createRoot(bookingElement);
    bookingRoot.render(<BookingWidget />);
  }

  // 2. Mount Rates & Availability Calendar
  const availabilityElement = document.getElementById(
    "cc-stays-react-availability",
  );
  if (availabilityElement) {
    const availabilityRoot = createRoot(availabilityElement);
    availabilityRoot.render(<AvailabilityCalendar />);
  }

  // 3. Mount Checkout Form
  const checkoutElement = document.getElementById("cc-stays-react-checkout");
  if (checkoutElement) {
    const checkoutRoot = createRoot(checkoutElement);
    checkoutRoot.render(<CheckoutForm />);
  }

  // 4. Mount Search Bar
  const searchBarMount = document.getElementById('cc-stays-react-search-bar');
  if (searchBarMount) {
      const searchRoot = createRoot(searchBarMount);
      searchRoot.render(<SearchBar />);
  }

  // 5. Mount Stays Archive Page
  const staysMount = document.getElementById('cc-stays-react-archive');
  if (staysMount) {
      const staysRoot = createRoot(staysMount);
      staysRoot.render(<StaysPage mountNode={staysMount} />);
  }

  // 6. Mount Property Amenities Sections
  document.querySelectorAll('.cc-stays-react-amenities').forEach((amenitiesMount) => {
      const amenitiesRoot = createRoot(amenitiesMount);
      amenitiesRoot.render(<AmenitiesSection mountNode={amenitiesMount} />);
  });

  // 7. Mount Homepage Middle Sections
  document.querySelectorAll('.cc-stays-react-homepage').forEach((homepageMount) => {
      const homepageRoot = createRoot(homepageMount);
      homepageRoot.render(<HomePageSections mountNode={homepageMount} />);
  });

  // 8. Mount Coastal Homepage Variant
  document.querySelectorAll('.cc-stays-react-homepage-coastal').forEach((homepageMount) => {
      const homepageRoot = createRoot(homepageMount);
      homepageRoot.render(<HomePageCoastal mountNode={homepageMount} />);
  });

  // 9. Mount Revamped Homepage Variant
  document.querySelectorAll('.cc-stays-react-homepage-revamp').forEach((homepageMount) => {
      const homepageRoot = createRoot(homepageMount);
      homepageRoot.render(<HomePageRevamp mountNode={homepageMount} />);
  });

  // 10. Mount About Page
  document.querySelectorAll('.cc-stays-react-about').forEach((aboutMount) => {
      const aboutRoot = createRoot(aboutMount);
      aboutRoot.render(<AboutPage mountNode={aboutMount} />);
  });

  // 11. Mount Journal Page
  document.querySelectorAll('.cc-stays-react-journal').forEach((journalMount) => {
      const journalRoot = createRoot(journalMount);
      journalRoot.render(<JournalPage mountNode={journalMount} />);
  });

  // 12. Mount Contact Page
  document.querySelectorAll('.cc-stays-react-contact').forEach((contactMount) => {
      const contactRoot = createRoot(contactMount);
      contactRoot.render(<ContactPage mountNode={contactMount} />);
  });

  // 13. Mount Destinations Page
  document.querySelectorAll('.cc-stays-react-destinations').forEach((destinationsMount) => {
      const destinationsRoot = createRoot(destinationsMount);
      destinationsRoot.render(<DestinationsPage mountNode={destinationsMount} />);
  });

  // 14. Mount Experiences Page
  document.querySelectorAll('.cc-stays-react-experiences').forEach((experiencesMount) => {
      const experiencesRoot = createRoot(experiencesMount);
      experiencesRoot.render(<ExperiencesPage mountNode={experiencesMount} />);
  });

  // 15. Mount Standalone Header
  document.querySelectorAll('.cc-stays-react-header').forEach((headerMount) => {
      const headerRoot = createRoot(headerMount);
      headerRoot.render(<ExactHeader links={readExactLinks(headerMount)} solid={headerMount.dataset.solid !== "false"} />);
  });

  // 16. Mount Standalone Footer
  document.querySelectorAll('.cc-stays-react-footer').forEach((footerMount) => {
      const footerRoot = createRoot(footerMount);
      footerRoot.render(<ExactFooter links={readExactLinks(footerMount)} />);
  });
});
