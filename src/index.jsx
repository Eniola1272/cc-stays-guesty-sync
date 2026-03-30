import React from "react";
import { createRoot } from "react-dom/client";
import BookingWidget from "./BookingWidget";
import AvailabilityCalendar from "./AvailabilityCalendar";
import CheckoutForm from "./CheckoutForm";

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
});
