import React, { useState, useEffect } from 'react';
import './BookingWidget.css'; // Reusing your beautiful styling

const CheckoutForm = () => {
    const [bookingData, setBookingData] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Grab the data from the URL when the page loads
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const listingId = params.get('listingId');
        
        if (listingId) {
            setBookingData({
                listingId: listingId,
                checkIn: params.get('checkIn'),
                checkOut: params.get('checkOut'),
                guests: params.get('guests'),
                price: params.get('price')
            });
        }
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch('/wp-json/cc-stays/v1/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...bookingData,
                    guest: formData
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create reservation.');
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

    if (!bookingData) return <div className="cc-booking-widget">Loading booking details...</div>;

    if (message) return (
        <div className="cc-booking-widget" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h3 style={{ color: 'var(--cc-green-dark)' }}>{message}</h3>
        </div>
    );

    return (
        <div className="cc-booking-widget" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div className="cc-booking-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                <h2>Complete Your Reservation</h2>
                <div className="cc-price-row" style={{ marginTop: '15px' }}>
                    <span>{bookingData.checkIn} to {bookingData.checkOut}</span>
                    <strong>Total: ${bookingData.price}</strong>
                </div>
            </div>

            <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="cc-input-group">
                        <label>First Name</label>
                        <div className="cc-input-wrapper">
                            <input required name="firstName" onChange={handleInputChange} placeholder="John" />
                        </div>
                    </div>
                    <div className="cc-input-group">
                        <label>Last Name</label>
                        <div className="cc-input-wrapper">
                            <input required name="lastName" onChange={handleInputChange} placeholder="Doe" />
                        </div>
                    </div>
                </div>

                <div className="cc-input-group">
                    <label>Email Address</label>
                    <div className="cc-input-wrapper">
                        <input required type="email" name="email" onChange={handleInputChange} placeholder="john@example.com" />
                    </div>
                </div>

                <div className="cc-input-group">
                    <label>Phone Number</label>
                    <div className="cc-input-wrapper">
                        <input required type="tel" name="phone" onChange={handleInputChange} placeholder="+1 234 567 8900" />
                    </div>
                </div>

                <button type="submit" className="cc-btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
                    {loading ? 'Processing...' : 'Confirm Booking'}
                </button>
            </form>
        </div>
    );
};

export default CheckoutForm;
