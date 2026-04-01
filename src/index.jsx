import React from "react";
import { createRoot } from "react-dom/client";
import BookingWidget from "./BookingWidget";
import AvailabilityCalendar from "./AvailabilityCalendar";
import CheckoutForm from "./CheckoutForm";
import SearchBar from "./SearchBar";
import StaysPage from "./StaysPage";

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
      staysRoot.render(<StaysPage />);
  }
});
