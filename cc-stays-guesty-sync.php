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
            }
            else {
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

                // Get the first image from the Guesty pictures array
                if (!empty($listing['pictures']) && is_array($listing['pictures'])) {
                    $first_image = $listing['pictures'][0];
                    // Guesty usually stores the best quality under 'original' or 'large'
                    $image_url = isset($first_image['original']) ? $first_image['original'] : (isset($first_image['large']) ? $first_image['large'] : false);

                    if ($image_url) {
                        $this->sideload_featured_image($post_id, $image_url);
                    }
                }
            }
        }
    }

    /**
     * Step 4: Sideload Image to WordPress Media Library
     */
    private function sideload_featured_image($post_id, $image_url)
    {
        // Prevent re-downloading the exact same image on every sync
        $synced_image_url = get_post_meta($post_id, '_guesty_synced_image', true);
        if ($synced_image_url === $image_url) {
            return;
        }

        // Require necessary WordPress core files for handling media
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');

        // Download the image and return the new Media Library ID
        $attachment_id = media_sideload_image($image_url, $post_id, null, 'id');

        if (!is_wp_error($attachment_id)) {
            // Set it as the Elementor Featured Image
            set_post_thumbnail($post_id, $attachment_id);
            // Save the Guesty URL in the database so we know it's already done
            update_post_meta($post_id, '_guesty_synced_image', $image_url);
        }
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

        // Ping Guesty's quoting endpoint
        $response = wp_remote_post($this->api_base . '/v1/reservations/quotes', [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            'body' => wp_json_encode([
                'listingId' => sanitize_text_field($params['listingId']),
                'checkIn' => sanitize_text_field($params['checkIn']),
                'checkOut' => sanitize_text_field($params['checkOut']),
                'guestsCount' => isset($params['guests']) ? intval($params['guests']) : 1
            ]),
            'timeout' => 15
        ]);

        if (is_wp_error($response)) {
            return new WP_Error('api_error', 'Failed to connect to Guesty API.', ['status' => 500]);
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        // If Guesty returns an error (like "Dates not available")
        if (isset($body['error'])) {
            return new WP_REST_Response(['available' => false, 'message' => $body['error']['message']], 400);
        }

        // If successful, pass the pricing breakdown back to React
        return new WP_REST_Response([
            'available' => true,
            'totalPrice' => $body['prices']['totalPrice'],
            'currency' => $body['currency'],
            'breakdown' => $body['prices'] // Includes taxes, cleaning fees, etc.
        ], 200);
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