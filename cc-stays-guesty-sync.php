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
    private $client_id = '0oatncf3pajf7P7cP5d7';
    private $client_secret = 'wuhCr4GiMiLyE0fwSnbntL_MZ980jiCtmM8ymRuGljMTe4SpBoCF2rt0ZsLzi3Jx';
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

        // Output the div for React to mount to, passing the Guesty ID
        return '<div id="cc-stays-react-booking" data-listing-id="' . esc_attr($guesty_id) . '"></div>';
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
     * Load the React App on the frontend
     */
    public function enqueue_react_app()
    {
        // Only load this heavy JS if we are on a single property page
        if (!is_singular('properties'))
            return;

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
}

// Initialize the plugin
new CC_Stays_Guesty_Sync();