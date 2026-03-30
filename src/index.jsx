import React from "react";
import { createRoot } from "react-dom/client";
import BookingWidget from "./BookingWidget";
import AvailabilityCalendar from "./AvailabilityCalendar";

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
});
