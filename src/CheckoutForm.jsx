import React, { useEffect, useMemo, useState } from "react";
import "./BookingWidget.css";

const parseAmount = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatMoney = (value, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(parseAmount(value));

const parseLocalDate = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDate = (value) => {
  const date = parseLocalDate(value);
  if (!date) return "Add date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getNights = (checkIn, checkOut) => {
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);
  if (!start || !end) return 0;
  return Math.max(Math.round((end - start) / 86400000), 0);
};

const CheckIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const MailIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.9.65 2.81a2 2 0 0 1-.45 2.11L8.05 9.9a16 16 0 0 0 6 6l1.26-1.26a2 2 0 0 1 2.11-.45c.91.3 1.85.52 2.81.65A2 2 0 0 1 22 16.92z" />
  </svg>
);

const CheckoutForm = () => {
    const [bookingData, setBookingData] = useState(null);
    const [property, setProperty] = useState(null);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        specialRequest: "",
        acceptedTerms: false,
        marketingOptIn: false
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Grab the data from the URL when the page loads
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const listingId = params.get("listingId");
        
        if (listingId) {
            setBookingData({
                listingId: listingId,
                checkIn: params.get("checkIn"),
                checkOut: params.get("checkOut"),
                guests: params.get("guests") || "1",
                price: params.get("price") || "0",
                subtotal: params.get("subtotal"),
                fees: params.get("fees"),
                taxes: params.get("taxes"),
                currency: params.get("currency") || "USD"
            });
        }
    }, []);

    useEffect(() => {
        if (!bookingData?.listingId) return;

        fetch("/wp-json/cc-stays/v1/search-stays")
            .then((response) => response.json())
            .then((properties) => {
                if (!Array.isArray(properties)) return;
                const match = properties.find((item) => item.listingId === bookingData.listingId);
                if (match) setProperty(match);
            })
            .catch(() => {});
    }, [bookingData?.listingId]);

    const handleInputChange = (e) => {
        const { name, type, checked, value } = e.target;
        setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        if (!formData.acceptedTerms) {
            setMessage("Error: Please accept the privacy policy and terms before requesting to book.");
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch("/wp-json/cc-stays/v1/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...bookingData,
                    guest: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        phone: formData.phone,
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create reservation.");
            }

            // Success! 
            setMessage("Booking confirmed! Check your email for payment instructions.");
            
            // NOTE: If Guesty returns a payment link, we can redirect them here instead!
            // if (data.paymentUrl) window.location.href = data.paymentUrl;

        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const nights = useMemo(
        () => getNights(bookingData?.checkIn, bookingData?.checkOut),
        [bookingData?.checkIn, bookingData?.checkOut],
    );

    const subtotal = parseAmount(bookingData?.subtotal || bookingData?.price);
    const fees = parseAmount(bookingData?.fees);
    const taxes = parseAmount(bookingData?.taxes);
    const total = parseAmount(bookingData?.price) || subtotal + fees + taxes;
    const currency = bookingData?.currency || "USD";

    if (!bookingData) {
        return (
            <div className="cc-checkout-shell">
                <div className="cc-checkout-empty">Loading booking details...</div>
            </div>
        );
    }

    if (message) {
        const isError = message.startsWith("Error:");

        return (
            <div className="cc-checkout-shell">
                {isError ? (
                    <div className="cc-checkout-message is-error">
                        <p>{message}</p>
                        <button type="button" className="cc-checkout-message-btn" onClick={() => setMessage(null)}>
                            Return to details
                        </button>
                    </div>
                ) : (
                    <div className="cc-checkout-success-card">
                        <div className="cc-checkout-success-content">
                            <div className="cc-checkout-success-icon">
                                <CheckIcon />
                            </div>
                            <p className="cc-checkout-success-kicker">Request received</p>
                            <h1>Booking confirmed</h1>
                            <p className="cc-checkout-success-copy">
                                Check your email for payment instructions. Our team will review your stay details and send the next step shortly.
                            </p>

                            <div className="cc-checkout-success-details">
                                <div>
                                    <span>Stay</span>
                                    <strong>{property?.title || "CC Stays reservation"}</strong>
                                </div>
                                <div>
                                    <span>Dates</span>
                                    <strong>{formatDate(bookingData.checkIn)} - {formatDate(bookingData.checkOut)}</strong>
                                </div>
                                <div>
                                    <span>Total</span>
                                    <strong>{formatMoney(total, currency)}</strong>
                                </div>
                            </div>

                            <div className="cc-checkout-success-contact">
                                <a href="mailto:hello@ccstays.com">
                                    <MailIcon />
                                    <span>hello@ccstays.com</span>
                                </a>
                                <a href="tel:7865686823">
                                    <PhoneIcon />
                                    <span>786-568-6823</span>
                                </a>
                            </div>
                        </div>
                        <div className="cc-checkout-success-mark" aria-hidden="true">
                            <span>CC</span>
                            <strong>STAYS</strong>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="cc-checkout-shell">
            <div className="cc-checkout-breadcrumb">
                <a href="/">Home</a>
                <span>/</span>
                <a href={property?.url || "/stays"}>{property?.title || "Stay"}</a>
                <span>/</span>
                <strong>Checkout</strong>
            </div>

            <div className="cc-checkout-layout">
                <main className="cc-checkout-main">
                    <h1>Fill in your details</h1>
                    <form id="cc-checkout-form" onSubmit={handleBooking} className="cc-checkout-form">
                        <section className="cc-checkout-section">
                            <h2>Guest information</h2>
                            <div className="cc-checkout-grid">
                                <label className="cc-checkout-field">
                                    <span>First name</span>
                                    <input required name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Guest first name *" />
                                </label>
                                <label className="cc-checkout-field">
                                    <span>Last name</span>
                                    <input required name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Guest last name *" />
                                </label>
                                <label className="cc-checkout-field">
                                    <span>Email</span>
                                    <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email address *" />
                                </label>
                                <label className="cc-checkout-field">
                                    <span>Phone number</span>
                                    <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Enter phone number *" />
                                </label>
                            </div>

                            <label className="cc-checkout-field cc-checkout-field--wide">
                                <span>Add a special request</span>
                                <textarea name="specialRequest" value={formData.specialRequest} onChange={handleInputChange} placeholder="Add a special request" />
                            </label>
                        </section>

                        <section className="cc-checkout-consents">
                            <label className="cc-checkout-check">
                                <input required type="checkbox" name="acceptedTerms" checked={formData.acceptedTerms} onChange={handleInputChange} />
                                <span>I have read and accept the <a href="/privacy-policy/" target="_blank" rel="noreferrer">Privacy policy</a> and <a href="/terms-and-conditions/" target="_blank" rel="noreferrer">Terms and conditions</a>.</span>
                            </label>
                            <label className="cc-checkout-check">
                                <input type="checkbox" name="marketingOptIn" checked={formData.marketingOptIn} onChange={handleInputChange} />
                                <span>I am interested in receiving CC Stays updates, offers, and local recommendations.</span>
                            </label>
                        </section>

                        <button type="submit" className="cc-checkout-mobile-submit" disabled={loading || !formData.acceptedTerms}>
                            {loading ? "Sending request..." : "Request to Book"}
                        </button>
                    </form>
                </main>

                <aside className="cc-checkout-summary" aria-label="Booking summary">
                    <div className="cc-checkout-summary-image-wrap">
                        {property?.image ? (
                            <img src={property.image} alt={property.title} className="cc-checkout-summary-image" />
                        ) : (
                            <div className="cc-checkout-summary-image cc-checkout-summary-image--empty" />
                        )}
                    </div>

                    <div className="cc-checkout-summary-body">
                        <h2>{property?.title || "Your CC Stays reservation"}</h2>
                        {property?.city && <p className="cc-checkout-summary-location">{property.city}</p>}

                        <div className="cc-checkout-stay-facts">
                            <div>
                                <span>Check In</span>
                                <strong>{formatDate(bookingData.checkIn)}</strong>
                            </div>
                            <div>
                                <span>Check Out</span>
                                <strong>{formatDate(bookingData.checkOut)}</strong>
                            </div>
                            <div>
                                <span>Nights</span>
                                <strong>{nights} Night{nights === 1 ? "" : "s"}</strong>
                            </div>
                            <div>
                                <span>Guest</span>
                                <strong>{bookingData.guests}</strong>
                            </div>
                        </div>

                        <div className="cc-checkout-price-lines">
                            <div>
                                <span>Subtotal</span>
                                <strong>{formatMoney(subtotal, currency)}</strong>
                            </div>
                            {fees > 0 && (
                                <div>
                                    <span>Fees</span>
                                    <strong>{formatMoney(fees, currency)}</strong>
                                </div>
                            )}
                            {taxes > 0 && (
                                <div>
                                    <span>Taxes</span>
                                    <strong>{formatMoney(taxes, currency)}</strong>
                                </div>
                            )}
                            <div className="cc-checkout-total">
                                <span>Total</span>
                                <strong>{formatMoney(total, currency)}</strong>
                            </div>
                        </div>

                        <button type="submit" form="cc-checkout-form" className="cc-checkout-summary-submit" disabled={loading || !formData.acceptedTerms}>
                            {loading ? "Sending request..." : "Request to Book"}
                        </button>
                        <p className="cc-checkout-charge-note">You will not be charged until the booking is confirmed.</p>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CheckoutForm;
