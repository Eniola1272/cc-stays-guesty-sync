<?php
/**
 * Plugin Name: CC Stays - Guesty API Sync
 * Description: Custom integration to sync Guesty listings to WordPress Custom Post Types.
 * Version: 1.01
 * Author: CC Stays
 */

if (!defined('ABSPATH'))
    exit; // Exit if accessed directly

class CC_Stays_Guesty_Sync
{

    // Your Guesty Credentials
    private $client_id = '0oavt02lhecydwH7t5d7';
    private $client_secret = 'CN36Ejom8wbtPe9CkTWx0_AZZBURIRXoZniRuo2US8g0xlaI03b4e7AvHfqYj5Y1';
    private $api_base = 'https://open-api.guesty.com';

    public function __construct()
    {
        // Create a manual trigger button in the WP Admin bar for testing
        add_action('admin_bar_menu', [$this, 'add_sync_button'], 999);
        add_action('admin_init', [$this, 'handle_manual_sync']);

        // Register custom REST API endpoints
        add_action('rest_api_init', [$this, 'register_booking_endpoints']);

        // Register the Elementor shortcode
        add_shortcode('cc_stays_booking', [$this, 'render_booking_widget']);

        // Register the Availability Calendar shortcode
        add_shortcode('cc_stays_availability', [$this, 'render_availability_widget']);

        // Register the Airbnb-style Amenities shortcode
        add_shortcode('cc_stays_amenities', [$this, 'render_amenities_widget']);

        // Register the Checkout shortcode
        add_shortcode('cc_stays_checkout', [$this, 'render_checkout_widget']);

        add_shortcode('cc_stays_dynamic_map', [$this, 'render_dynamic_leaflet_map']);

        // Register the Global Search Bar shortcode
        add_shortcode('cc_stays_search_bar', [$this, 'render_search_bar_widget']);

        // Register the homepage body sections shortcode
        add_shortcode('cc_stays_homepage', [$this, 'render_homepage_sections_widget']);
        add_shortcode('cc_stays_homepage_sections', [$this, 'render_homepage_sections_widget']);

        // Register the Stays Archive App shortcode
        add_shortcode('cc_stays_archive', function() { return '<div id="cc-stays-react-archive"></div>'; });

        // Enqueue the compiled React app
        add_action('wp_enqueue_scripts', [$this, 'enqueue_react_app']);
    }

    /**
     * Step 1: Get the Bearer Token
     */
    private function get_access_token()
    {
        // Check if we have a valid cached token to save API calls
        $cached_token = get_transient('guesty_access_token');
        if ($cached_token)
            return $cached_token;

        $response = wp_remote_post($this->api_base . '/oauth2/token', [
            'headers' => [
                'Accept' => 'application/json',
                'Content-Type' => 'application/x-www-form-urlencoded',
            ],
            'body' => [
                'grant_type' => 'client_credentials',
                'client_id' => $this->client_id,
                'client_secret' => $this->client_secret,
            ]
        ]);

        if (is_wp_error($response))
            return false;

        $body = json_decode(wp_remote_retrieve_body($response), true);

        if (isset($body['access_token'])) {
            // Cache the token for 23 hours (Guesty tokens usually last 24h)
            set_transient('guesty_access_token', $body['access_token'], 23 * HOUR_IN_SECONDS);
            return $body['access_token'];
        }

        return false;
    }

    /**
     * Step 2: Fetch Listings from Guesty
     */
    private function fetch_guesty_listings()
    {
        $token = $this->get_access_token();
        if (!$token)
            return false;

        $response = wp_remote_get($this->api_base . '/v1/listings?limit=50', [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Accept' => 'application/json',
            ],
            'timeout' => 30
        ]);

        if (is_wp_error($response))
            return false;

        $body = json_decode(wp_remote_retrieve_body($response), true);
        return isset($body['results']) ? $body['results'] : false;
    }

    /**
     * Step 3: Map Data to WordPress Database
     */
    public function sync_properties_to_wp()
    {
        $listings = $this->fetch_guesty_listings();
        if (!$listings)
            return;

        foreach ($listings as $listing) {
            $guesty_id = sanitize_text_field($listing['_id']);
            $title = sanitize_text_field($listing['title']);

            // Check if this property already exists in WordPress
            $existing_posts = get_posts([
                'post_type' => 'properties', // Your CPT name
                'meta_key' => 'guesty_listing_id',
                'meta_value' => $guesty_id,
                'posts_per_page' => 1,
                'post_status' => 'any'
            ]);

            $post_data = [
                'post_title' => $title,
                'post_content' => wp_kses_post($listing['publicDescription']['summary']),
                'post_status' => $listing['active'] ? 'publish' : 'draft',
                'post_type' => 'properties'
            ];

            if ($existing_posts) {
                // Update existing property
                $post_id = $existing_posts[0]->ID;
                $post_data['ID'] = $post_id;
                wp_update_post($post_data);
            } else {
                // Create new property
                $post_id = wp_insert_post($post_data);
            }

            // Map the Advanced Custom Fields (ACF)
            if ($post_id && !is_wp_error($post_id)) {
                update_post_meta($post_id, 'guesty_listing_id', $guesty_id);

                // Add the Leaflet GPS Coordinates!
                if (isset($listing['address']['lat'])) {
                    update_post_meta($post_id, 'latitude', $listing['address']['lat']);
                }
                if (isset($listing['address']['lng'])) {
                    update_post_meta($post_id, 'longitude', $listing['address']['lng']);
                }
                if (isset($listing['address']['full'])) {
                    update_post_meta($post_id, 'address_full', $listing['address']['full']);
                }

                // Example ACF updates:
                if (isset($listing['prices']['basePrice'])) {
                    update_post_meta($post_id, 'nightly_rate', $listing['prices']['basePrice']);
                }
                if (isset($listing['bedrooms'])) {
                    update_post_meta($post_id, 'bedrooms', $listing['bedrooms']);
                }
                if (isset($listing['bathrooms'])) {
                    update_post_meta($post_id, 'bathrooms', $listing['bathrooms']);
                }
                if (isset($listing['address']['city'])) {
                    update_post_meta($post_id, 'location_city', $listing['address']['city']);
                }
                if (isset($listing['amenities']) && is_array($listing['amenities'])) {
                    update_post_meta($post_id, 'guesty_amenities', wp_json_encode($listing['amenities']));
                }

            }
        }
    }

    /**
     * Step 4: Sideload Images to WordPress Media Library and return the ID
     */
    private function sideload_property_image($post_id, $image_url, $is_featured = false)
    {
        // Create a unique meta key for each image URL to prevent duplicate downloads
        $hash = md5($image_url);
        $existing_id = get_post_meta($post_id, '_guesty_img_' . $hash, true);

        if ($existing_id) {
            return $existing_id; // Already downloaded!
        }

        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');

        $attachment_id = media_sideload_image($image_url, $post_id, null, 'id');

        if (!is_wp_error($attachment_id)) {
            // Remember that we downloaded this specific URL
            update_post_meta($post_id, '_guesty_img_' . $hash, $attachment_id);

            if ($is_featured) {
                set_post_thumbnail($post_id, $attachment_id);
            }
            return $attachment_id;
        }

        return false;
    }

    /**
     * Testing UI: Adds a 'Sync Guesty' button to the top WordPress Admin bar
     */
    public function add_sync_button($wp_admin_bar)
    {
        $wp_admin_bar->add_node([
            'id' => 'sync_guesty_api',
            'title' => '🔄 Sync Guesty Properties',
            'href' => admin_url('?sync_guesty=true'),
        ]);
    }

    public function handle_manual_sync()
    {
        if (isset($_GET['sync_guesty']) && $_GET['sync_guesty'] === 'true' && current_user_can('manage_options')) {
            $this->sync_properties_to_wp();
            wp_redirect(admin_url('edit.php?post_type=properties&sync_status=success'));
            exit;
        }
    }

    /**
     * Register the custom REST route for the React frontend
     */
    public function register_booking_endpoints()
    {
        register_rest_route('cc-stays/v1', '/quote', [
            'methods' => 'POST',
            'callback' => [$this, 'get_guesty_quote'],
            'permission_callback' => '__return_true' // Open to public for booking
        ]);

        // Availability calendar endpoint (GET)
        register_rest_route('cc-stays/v1', '/availability', [
            'methods' => 'GET',
            'callback' => [$this, 'get_guesty_availability'],
            'permission_callback' => '__return_true'
        ]);

        // Checkout/Booking endpoint (POST)
        register_rest_route('cc-stays/v1', '/book', [
            'methods' => 'POST',
            'callback' => [$this, 'create_guesty_reservation'],
            'permission_callback' => '__return_true'
        ]);

        // Stays Archive Master Data endpoint (GET)
        register_rest_route('cc-stays/v1', '/search-stays', [
            'methods' => 'GET',
            'callback' => [$this, 'get_stays_archive_data'],
            'permission_callback' => '__return_true'
        ]);
    }

    /**
     * Handle the request from React and fetch the quote from Guesty
     */
    public function get_guesty_quote($request)
    {
        $params = $request->get_json_params();

        // Validate required fields from the React frontend
        if (empty($params['listingId']) || empty($params['checkIn']) || empty($params['checkOut'])) {
            return new WP_Error('missing_data', 'Listing ID, Check-in, and Check-out dates are required.', ['status' => 400]);
        }

        $token = $this->get_access_token();
        if (!$token) {
            return new WP_Error('auth_failed', 'Could not authenticate with booking server.', ['status' => 500]);
        }

        // Build the payload we're sending to Guesty
        $guesty_payload = [
            'listingId' => sanitize_text_field($params['listingId']),
            'checkInDateLocalized' => sanitize_text_field($params['checkIn']),
            'checkOutDateLocalized' => sanitize_text_field($params['checkOut']),
            'guestsCount' => isset($params['guests']) ? intval($params['guests']) : 1,
            'source' => 'website'
        ];

        // Ping Guesty's quoting endpoint
        $response = wp_remote_post($this->api_base . '/v1/quotes', [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            'body' => wp_json_encode($guesty_payload),
            'timeout' => 15
        ]);

        if (is_wp_error($response)) {
            return new WP_REST_Response([
                'available' => false,
                'message' => 'Failed to connect to Guesty API.',
                'debug' => [
                    'wp_error' => $response->get_error_message(),
                    'payload_sent' => $guesty_payload
                ]
            ], 500);
        }

        $http_code = wp_remote_retrieve_response_code($response);
        $raw_body = wp_remote_retrieve_body($response);
        $body = json_decode($raw_body, true);

        // If Guesty returns an error code (anything outside the 200-299 success range)
        if ($http_code < 200 || $http_code >= 300) {
            return new WP_REST_Response([
                'available' => false,
                'message' => isset($body['error']['message']) ? $body['error']['message'] : 'Guesty returned HTTP ' . $http_code,
                'debug' => [
                    'guesty_http_code' => $http_code,
                    'guesty_response' => $body,
                    'payload_sent' => $guesty_payload
                ]
            ], 200); // Return 200 to our frontend so React can gracefully read the JSON error
        }

        // Drill down into Guesty's nested quoting structure to find the price
        $rate_plan = isset($body['rates']['ratePlans'][0]) ? $body['rates']['ratePlans'][0] : null;
        $money_data = isset($rate_plan['money']['money']) ? $rate_plan['money']['money'] : null;

        $total_price = isset($money_data['subTotalPrice']) ? $money_data['subTotalPrice'] : null;
        $currency = isset($money_data['currency']) ? $money_data['currency'] : 'USD';

        // Grab the breakdown (Nightly Rate vs Cleaning Fees)
        $breakdown = isset($money_data['invoiceItems']) ? $money_data['invoiceItems'] : null;

        // If successful, pass the pricing breakdown back to React
        return new WP_REST_Response([
            'available' => true,
            'totalPrice' => $total_price,
            'currency' => $currency,
            'breakdown' => $breakdown,
            'debug' => [
                'guesty_http_code' => $http_code,
                'payload_sent' => $guesty_payload,
                'raw_guesty_response' => $body
            ]
        ], 200);
    }

    /**
     * Fetch blocked/unavailable dates from Guesty's Calendar API
     */
    public function get_guesty_availability($request)
    {
        $listing_id = sanitize_text_field($request->get_param('listingId'));

        if (empty($listing_id)) {
            return new WP_Error('missing_data', 'Listing ID is required.', ['status' => 400]);
        }

        $token = $this->get_access_token();
        if (!$token) {
            return new WP_Error('auth_failed', 'Could not authenticate with booking server.', ['status' => 500]);
        }

        // Fetch 12 months of calendar data from Guesty
        $today = date('Y-m-d');
        $end_date = date('Y-m-d', strtotime('+12 months'));

        $response = wp_remote_get(
            $this->api_base . '/v1/availability-pricing/api/calendar/listings/' . $listing_id . '?startDate=' . $today . '&endDate=' . $end_date,
            [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token,
                    'Accept' => 'application/json',
                ],
                'timeout' => 15
            ]
        );

        if (is_wp_error($response)) {
            return new WP_Error('api_error', 'Failed to connect to Guesty Calendar API.', ['status' => 500]);
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        // Filter out the unavailable dates
        $blocked_dates = [];
        if (isset($body['data']['days']) && is_array($body['data']['days'])) {
            foreach ($body['data']['days'] as $day) {
                if (isset($day['status']) && $day['status'] !== 'available') {
                    $blocked_dates[] = $day['date']; // "YYYY-MM-DD"
                }
            }
        }

        return new WP_REST_Response(['blockedDates' => $blocked_dates], 200);
    }

    /**
     * Render the React mount point via Shortcode
     */
    public function render_booking_widget()
    {
        // Only run on single property pages
        if (!is_singular('properties'))
            return '';

        $post_id = get_the_ID();
        $guesty_id = get_post_meta($post_id, 'guesty_listing_id', true);

        if (!$guesty_id)
            return '<p>Booking unavailable (No Guesty ID found).</p>';

        // Fetch the property's nightly rate and min stay from post meta
        $nightly_rate = get_post_meta($post_id, 'nightly_rate', true) ?: '';
        $min_nights = get_post_meta($post_id, 'min_nights', true) ?: '2';

        // Output the div for React to mount to, passing the Guesty ID and pricing data
        return '<div id="cc-stays-react-booking" data-listing-id="' . esc_attr($guesty_id) . '" data-nightly-rate="' . esc_attr($nightly_rate) . '" data-min-nights="' . esc_attr($min_nights) . '"></div>';
    }

    /**
     * Render the React mount point for the Availability Calendar via Shortcode
     */
    public function render_availability_widget()
    {
        if (!is_singular('properties'))
            return '';

        $post_id = get_the_ID();
        $guesty_id = get_post_meta($post_id, 'guesty_listing_id', true);

        if (!$guesty_id)
            return '';

        return '<div id="cc-stays-react-availability" data-listing-id="' . esc_attr($guesty_id) . '"></div>';
    }

    /**
     * Render the Airbnb-style amenities section via shortcode.
     */
    public function render_amenities_widget()
    {
        if (!is_singular('properties'))
            return '';

        $post_id = get_the_ID();
        $amenities_json = $this->get_property_amenities_json($post_id);

        return '<div class="cc-stays-react-amenities" data-amenities="' . esc_attr($amenities_json) . '"></div>';
    }

    private function get_property_amenities_json($post_id)
    {
        $meta_keys = [
            'guesty_amenities',
            'amenities',
            'property_amenities',
            'listing_amenities',
        ];

        foreach ($meta_keys as $meta_key) {
            $value = get_post_meta($post_id, $meta_key, true);
            if (empty($value))
                continue;

            if (is_array($value)) {
                return wp_json_encode($value);
            }

            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE && !empty($decoded)) {
                return wp_json_encode($decoded);
            }

            if (is_string($value)) {
                $items = array_filter(array_map('trim', preg_split('/[\r\n,]+/', $value)));
                if (!empty($items)) {
                    return wp_json_encode(array_values($items));
                }
            }
        }

        return '';
    }

    /**
     * Load the React App on the frontend
     */
    public function enqueue_react_app()
    {
        // Load React on single properties, checkout, the homepage, AND the unified Stays/Properties catalog
        $has_homepage_shortcode = false;
        if (is_singular()) {
            $post = get_post();
            $has_homepage_shortcode = $post && (
                has_shortcode($post->post_content, 'cc_stays_homepage') ||
                has_shortcode($post->post_content, 'cc_stays_homepage_sections')
            );
        }

        if (!is_singular('properties') && !is_page('checkout') && !is_front_page() && !is_page(['stays', 'properties']) && !$has_homepage_shortcode) {
            return;
        }

        $plugin_dir = plugin_dir_path(__FILE__);
        $plugin_url = plugin_dir_url(__FILE__);

        // Grab the auto-generated asset file with the NEW Webpack naming convention
        $asset_file = $plugin_dir . 'build/index.jsx.asset.php';

        if (file_exists($asset_file)) {
            $assets = require($asset_file);

            // 1. Enqueue the compiled React JS
            wp_enqueue_script(
                'cc-stays-react-booking',
                $plugin_url . 'build/index.jsx.js',
                $assets['dependencies'],
                $assets['version'],
                true // Load in footer
            );

            // 2. Enqueue the Datepicker CSS
            wp_enqueue_style(
                'cc-stays-react-datepicker-css',
                $plugin_url . 'build/index.jsx.css',
                [],
                $assets['version']
            );
        }
    }

    /**
     * Handle the request from React and create the reservation in Guesty
     */
    public function create_guesty_reservation($request)
    {
        $params = $request->get_json_params();

        // Validate that we received the guest data
        if (empty($params['listingId']) || empty($params['checkIn']) || empty($params['checkOut']) || empty($params['guest'])) {
            return new WP_Error('missing_data', 'Missing required booking data.', ['status' => 400]);
        }

        $token = $this->get_access_token();
        if (!$token) {
            return new WP_Error('auth_failed', 'Could not authenticate with booking server.', ['status' => 500]);
        }

        $guest_data = $params['guest'];

        $check_in_date = sanitize_text_field($params['checkIn']);
        $check_out_date = sanitize_text_field($params['checkOut']);

        // Build the final reservation payload for Guesty
        $guesty_payload = [
            'listingId' => sanitize_text_field($params['listingId']),
            'checkInDateLocalized' => $check_in_date, // Guesty specifically requested this key
            'checkOutDateLocalized' => $check_out_date, // Guesty specifically requested this key
            'status' => 'reserved', // Keep this so Guesty locks the calendar only temporarily!
            'guestsCount' => isset($params['guests']) ? intval($params['guests']) : 1,
            'source' => 'website',
            'guest' => [
                'firstName' => sanitize_text_field($guest_data['firstName']),
                'lastName' => sanitize_text_field($guest_data['lastName']),
                'email' => sanitize_email($guest_data['email']),
                'phone' => sanitize_text_field($guest_data['phone']),
            ]
        ];

        // Ping Guesty's Reservation Creation Endpoint
        $response = wp_remote_post($this->api_base . '/v1/reservations', [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            'body' => wp_json_encode($guesty_payload),
            'timeout' => 20
        ]);

        if (is_wp_error($response)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Failed to connect to Guesty API.'
            ], 500);
        }

        $http_code = wp_remote_retrieve_response_code($response);
        $raw_body = wp_remote_retrieve_body($response); // Grab the raw text before decoding!
        $body = json_decode($raw_body, true);

        // Handle errors from Guesty (like if the dates got booked by someone else while they were checking out)
        if ($http_code < 200 || $http_code >= 300) {
            return new WP_REST_Response([
                'success' => false,
                'message' => isset($body['error']['message']) ? $body['error']['message'] : 'Failed to create reservation.',
                'debug' => [
                    'http_code' => $http_code,
                    'raw_response' => $raw_body, // This will expose the exact Guesty error
                    'payload_sent' => $guesty_payload
                ]
            ], 400);
        }

        // Success! Pass the confirmation back to React
        return new WP_REST_Response([
            'success' => true,
            'message' => 'Reservation created successfully.',
            'reservationId' => isset($body['_id']) ? $body['_id'] : null,
            'paymentUrl' => isset($body['paymentUrl']) ? $body['paymentUrl'] : null
        ], 200);
    }

    /**
     * Render the React mount point for the Checkout Page
     */
    public function render_checkout_widget()
    {
        // This shortcode can be placed anywhere, it doesn't need to be on a single property page
        return '<div id="cc-stays-react-checkout"></div>';
    }

    /**
     * Bridge function to feed Guesty coordinates into the 'Leaflet Map' plugin
     */
    public function render_dynamic_leaflet_map() {
        // Only run on single property pages
        if (!is_singular('properties')) return '';

        $post_id = get_the_ID();
        
        // Grab the coordinates we synced from Guesty
        $lat = get_post_meta($post_id, 'latitude', true);
        $lng = get_post_meta($post_id, 'longitude', true);

        if (empty($lat) || empty($lng)) {
            return '<p>Map location currently unavailable.</p>';
        }

        // Build the shortcodes required by the 'Leaflet Map' plugin
        $map_shortcode = sprintf('[leaflet-map lat="%s" lng="%s" zoom="14" height="400"]', $lat, $lng);
        $marker_shortcode = sprintf('[leaflet-marker lat="%s" lng="%s"]', $lat, $lng);

        // Tell WordPress to execute the plugin's shortcodes
        return do_shortcode($map_shortcode . $marker_shortcode);
    }

    public function render_search_bar_widget() {
        return '<div id="cc-stays-react-search-bar"></div>';
    }

    public function render_homepage_sections_widget($atts = []) {
        $atts = shortcode_atts([
            'home_url' => '/',
            'stays_url' => '/stays',
            'book_direct_url' => '/book-direct',
            'reviews_url' => '/reviews',
            'about_url' => '/about-us',
            'owners_url' => '/partner-with-us',
            'faq_url' => '/faq',
            'contact_url' => '/contact',
        ], $atts, 'cc_stays_homepage');

        $links = [
            'home' => esc_url_raw($atts['home_url']),
            'stays' => esc_url_raw($atts['stays_url']),
            'bookDirect' => esc_url_raw($atts['book_direct_url']),
            'reviews' => esc_url_raw($atts['reviews_url']),
            'about' => esc_url_raw($atts['about_url']),
            'owners' => esc_url_raw($atts['owners_url']),
            'faq' => esc_url_raw($atts['faq_url']),
            'contact' => esc_url_raw($atts['contact_url']),
        ];

        $image_base = plugin_dir_url(__FILE__) . 'assets/home/';
        $images = [
            'hero' => $image_base . 'cc-hero-sunset-pool.jpg',
            'cardOne' => $image_base . 'villa-banana-pool-lounge.jpg',
            'cardTwo' => $image_base . 'cc-bedroom-lamp-detail.jpg',
            'cardThree' => $image_base . 'cc-game-room-pool-view.jpg',
            'detail' => $image_base . 'cc-bedroom-green-tray.jpg',
            'standard' => $image_base . 'cc-living-room-mural.jpg',
            'manage' => $image_base . 'cc-hero-evening-bikes.jpg',
            'hostTeaser' => $image_base . 'cc-outdoor-guests-dining-lifestyle.jpg',
            'hosts' => $image_base . 'cc-welcome-tray.jpg',
            'final' => $image_base . 'villa-banana-outdoor-dining.jpg',
            'reviewOne' => $image_base . 'villa-banana-loungers.jpg',
            'reviewTwo' => $image_base . 'villa-banana-game-room.jpg',
            'reviewThree' => $image_base . 'villa-banana-bathroom.jpg',
        ];

        return '<div class="cc-stays-react-homepage" data-links="' . esc_attr(wp_json_encode($links)) . '" data-images="' . esc_attr(wp_json_encode($images)) . '"></div>';
    }

    public function get_stays_archive_data() {
        $properties = get_posts([
            'post_type'      => 'properties',
            'posts_per_page' => -1,
            'post_status'    => 'publish'
        ]);

        $results = [];
        foreach ($properties as $prop) {
            $post_id = $prop->ID;
            $image_url = get_the_post_thumbnail_url($post_id, 'large');
            
            $raw_content  = get_post_field('post_content', $post_id);
            $description  = wp_trim_words(strip_tags($raw_content), 20, '...');

            $results[] = [
                'id'          => $post_id,
                'listingId'   => get_post_meta($post_id, 'guesty_listing_id', true),
                'title'       => $prop->post_title,
                'url'         => get_permalink($post_id),
                'image'       => $image_url ? $image_url : 'https://via.placeholder.com/400x250?text=No+Image',
                'city'        => get_post_meta($post_id, 'location_city', true) ?: 'Florida',
                'guests'      => (int) (get_post_meta($post_id, 'guests', true) ?: 2),
                'bedrooms'    => (int) (get_post_meta($post_id, 'bedrooms', true) ?: 1),
                'bathrooms'   => (int) (get_post_meta($post_id, 'bathrooms', true) ?: 1),
                'pets'        => (int) get_post_meta($post_id, 'pets_allowed', true),
                'price'       => get_post_meta($post_id, 'nightly_rate', true) ?: 0,
                'description' => $description ?: '',
                'lat'         => floatval(get_post_meta($post_id, 'latitude', true)),
                'lng'         => floatval(get_post_meta($post_id, 'longitude', true)),
            ];
        }

        return new WP_REST_Response($results, 200);
    }
}

// Initialize the plugin
new CC_Stays_Guesty_Sync();
