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
        // Keep destructive sync actions out of the top admin bar.
        add_action('admin_menu', [$this, 'register_sync_admin_page']);
        add_action('admin_post_cc_stays_sync_guesty', [$this, 'handle_manual_sync']);

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
        add_shortcode('cc_stays_homepage_coastal', [$this, 'render_homepage_coastal_widget']);
        add_shortcode('cc_stays_homepage_revamp', [$this, 'render_homepage_revamp_widget']);
        add_shortcode('cc_stays_about', [$this, 'render_about_page_widget']);
        add_shortcode('cc_stays_about_revamp', [$this, 'render_about_page_widget']);
        add_shortcode('cc_stays_journal', [$this, 'render_journal_page_widget']);
        add_shortcode('cc_stays_journal_revamp', [$this, 'render_journal_page_widget']);
        add_shortcode('cc_stays_contact', [$this, 'render_contact_page_widget']);
        add_shortcode('cc_stays_contact_revamp', [$this, 'render_contact_page_widget']);
        add_shortcode('cc_stays_destinations', [$this, 'render_destinations_page_widget']);
        add_shortcode('cc_stays_destinations_revamp', [$this, 'render_destinations_page_widget']);
        add_shortcode('cc_stays_experiences', [$this, 'render_experiences_page_widget']);
        add_shortcode('cc_stays_experiences_revamp', [$this, 'render_experiences_page_widget']);
        add_shortcode('cc_stays_property_revamp', [$this, 'render_property_revamp_page']);
        add_shortcode('cc_stays_property_hero', [$this, 'render_property_hero_section']);
        add_shortcode('cc_stays_property_gallery', [$this, 'render_property_gallery_section']);
        add_shortcode('cc_stays_property_overview', [$this, 'render_property_overview_section']);
        add_shortcode('cc_stays_property_about', [$this, 'render_property_about_section']);
        add_shortcode('cc_stays_property_highlights', [$this, 'render_property_highlights_section']);
        add_shortcode('cc_stays_property_sleep', [$this, 'render_property_sleep_section']);
        add_shortcode('cc_stays_property_amenities', [$this, 'render_property_amenities_section']);
        add_shortcode('cc_stays_property_booking', [$this, 'render_property_booking_section']);
        add_shortcode('cc_stays_property_reviews', [$this, 'render_property_reviews_section']);
        add_shortcode('cc_stays_property_location', [$this, 'render_property_location_section']);
        add_shortcode('cc_stays_property_rules', [$this, 'render_property_rules_section']);
        add_shortcode('cc_stays_property_cta', [$this, 'render_property_cta_section']);

        // Register the Stays Archive App shortcode
        add_shortcode('cc_stays_archive', [$this, 'render_stays_archive_widget']);

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
                if (isset($listing['beds'])) {
                    update_post_meta($post_id, 'beds', intval($listing['beds']));
                }
                $guest_count = $listing['accommodates'] ?? $listing['personCapacity'] ?? $listing['maxOccupancy'] ?? null;
                if (!empty($guest_count)) {
                    update_post_meta($post_id, 'guests', intval($guest_count));
                }
                $min_nights = $listing['terms']['minNights'] ?? $listing['minNights'] ?? null;
                if (!empty($min_nights)) {
                    update_post_meta($post_id, 'min_nights', intval($min_nights));
                }
                if (isset($listing['address']['city'])) {
                    update_post_meta($post_id, 'location_city', $listing['address']['city']);
                }
                if (isset($listing['amenities']) && is_array($listing['amenities'])) {
                    update_post_meta($post_id, 'guesty_amenities', wp_json_encode($listing['amenities']));
                }
                update_post_meta($post_id, 'guesty_listing_raw', wp_json_encode($listing));

                $image_urls = $this->extract_guesty_image_urls($listing);
                if (!empty($image_urls)) {
                    update_post_meta($post_id, 'guesty_images', wp_json_encode($image_urls));
                    if (!has_post_thumbnail($post_id)) {
                        $this->sideload_property_image($post_id, $image_urls[0], true);
                    }
                }

            }
        }
    }

    private function extract_guesty_image_urls($listing)
    {
        $sources = [];
        foreach (['pictures', 'images', 'photos'] as $key) {
            if (!empty($listing[$key]) && is_array($listing[$key])) {
                $sources = array_merge($sources, $listing[$key]);
            }
        }

        $urls = [];
        foreach ($sources as $item) {
            $url = '';
            if (is_string($item)) {
                $url = $item;
            } elseif (is_array($item)) {
                $url = $item['original'] ?? $item['large'] ?? $item['url'] ?? $item['thumbnail'] ?? $item['src'] ?? '';
            }

            if ($url && filter_var($url, FILTER_VALIDATE_URL)) {
                $urls[] = esc_url_raw($url);
            }
        }

        return array_values(array_unique($urls));
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
     * Admin UI: Moves the Guesty sync behind a deliberate dashboard page.
     */
    public function register_sync_admin_page()
    {
        add_submenu_page(
            'edit.php?post_type=properties',
            'Guesty Sync',
            'Guesty Sync',
            'manage_options',
            'cc-stays-guesty-sync',
            [$this, 'render_sync_admin_page']
        );
    }

    public function render_sync_admin_page()
    {
        if (!current_user_can('manage_options')) {
            return;
        }

        $status = isset($_GET['sync_status']) ? sanitize_key($_GET['sync_status']) : '';
        ?>
        <div class="wrap">
            <h1>Guesty Sync</h1>

            <?php if ($status === 'success'): ?>
                <div class="notice notice-success is-dismissible">
                    <p>Guesty properties synced successfully.</p>
                </div>
            <?php elseif ($status === 'confirm_required'): ?>
                <div class="notice notice-error is-dismissible">
                    <p>Please confirm that you understand this sync can overwrite customized property data.</p>
                </div>
            <?php endif; ?>

            <div class="card" style="max-width: 760px;">
                <h2>Manual Guesty Property Sync</h2>
                <p>
                    This action pulls listing data from Guesty and updates matching WordPress properties.
                    It can overwrite customized fields that were previously synced from Guesty.
                </p>
                <p><strong>Use this only when you intentionally want to refresh Guesty-backed property data.</strong></p>

                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                    <?php wp_nonce_field('cc_stays_sync_guesty', 'cc_stays_sync_nonce'); ?>
                    <input type="hidden" name="action" value="cc_stays_sync_guesty">

                    <p>
                        <label>
                            <input type="checkbox" name="confirm_custom_data_risk" value="1" required>
                            I understand this can overwrite customized property data.
                        </label>
                    </p>

                    <?php submit_button('Run Guesty Sync', 'delete'); ?>
                </form>
            </div>
        </div>
        <?php
    }

    public function handle_manual_sync()
    {
        if (!current_user_can('manage_options')) {
            wp_die('You do not have permission to sync Guesty properties.');
        }

        check_admin_referer('cc_stays_sync_guesty', 'cc_stays_sync_nonce');

        if (empty($_POST['confirm_custom_data_risk'])) {
            wp_redirect(admin_url('edit.php?post_type=properties&page=cc-stays-guesty-sync&sync_status=confirm_required'));
            exit;
        }

        $this->sync_properties_to_wp();
        wp_redirect(admin_url('edit.php?post_type=properties&page=cc-stays-guesty-sync&sync_status=success'));
        exit;
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

        register_rest_route('cc-stays/v1', '/journal-signup', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_journal_signup'],
            'permission_callback' => '__return_true'
        ]);

        register_rest_route('cc-stays/v1', '/contact', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_contact_submission'],
            'permission_callback' => '__return_true'
        ]);
    }

    private function get_client_ip()
    {
        $keys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
        foreach ($keys as $key) {
            if (empty($_SERVER[$key])) {
                continue;
            }
            $value = sanitize_text_field(wp_unslash($_SERVER[$key]));
            $parts = explode(',', $value);
            return trim($parts[0]);
        }
        return 'unknown';
    }

    private function is_rate_limited($bucket, $limit = 5, $window = 10 * MINUTE_IN_SECONDS)
    {
        $ip = $this->get_client_ip();
        $key = 'cc_stays_rate_' . md5($bucket . '|' . $ip);
        $count = intval(get_transient($key));
        if ($count >= $limit) {
            return true;
        }
        set_transient($key, $count + 1, $window);
        return false;
    }

    private function get_mailchimp_config()
    {
        $api_key = defined('CC_STAYS_MAILCHIMP_API_KEY') ? CC_STAYS_MAILCHIMP_API_KEY : get_option('cc_stays_mailchimp_api_key', '');
        $list_id = defined('CC_STAYS_MAILCHIMP_AUDIENCE_ID') ? CC_STAYS_MAILCHIMP_AUDIENCE_ID : get_option('cc_stays_mailchimp_audience_id', '');
        $server = defined('CC_STAYS_MAILCHIMP_SERVER_PREFIX') ? CC_STAYS_MAILCHIMP_SERVER_PREFIX : get_option('cc_stays_mailchimp_server_prefix', '');

        if (!$server && strpos($api_key, '-') !== false) {
            $parts = explode('-', $api_key);
            $server = end($parts);
        }

        return [
            'api_key' => trim($api_key),
            'list_id' => trim($list_id),
            'server' => trim($server),
        ];
    }

    public function handle_journal_signup($request)
    {
        if ($this->is_rate_limited('journal_signup', 8)) {
            return new WP_Error('rate_limited', 'Too many signup attempts. Please try again shortly.', ['status' => 429]);
        }

        $params = $request->get_json_params();
        $email = sanitize_email($params['email'] ?? '');
        $first_name = sanitize_text_field($params['firstName'] ?? '');
        $last_name = sanitize_text_field($params['lastName'] ?? '');

        if (!is_email($email)) {
            return new WP_Error('invalid_email', 'Please enter a valid email address.', ['status' => 400]);
        }

        $config = $this->get_mailchimp_config();
        if (empty($config['api_key']) || empty($config['list_id']) || empty($config['server'])) {
            return new WP_Error('mailchimp_not_configured', 'Mailchimp is not configured yet.', ['status' => 500]);
        }

        $subscriber_hash = md5(strtolower($email));
        $endpoint = sprintf(
            'https://%s.api.mailchimp.com/3.0/lists/%s/members/%s',
            rawurlencode($config['server']),
            rawurlencode($config['list_id']),
            $subscriber_hash
        );

        $payload = [
            'email_address' => $email,
            'status_if_new' => 'subscribed',
            'status' => 'subscribed',
            'merge_fields' => array_filter([
                'FNAME' => $first_name,
                'LNAME' => $last_name,
            ]),
            'tags' => ['CC Stays Journal'],
        ];

        $response = wp_remote_request($endpoint, [
            'method' => 'PUT',
            'headers' => [
                'Authorization' => 'Basic ' . base64_encode('ccstays:' . $config['api_key']),
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            'body' => wp_json_encode($payload),
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            return new WP_Error('mailchimp_error', 'Could not connect to Mailchimp.', ['status' => 500]);
        }

        $http_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($http_code < 200 || $http_code >= 300) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $body['detail'] ?? 'Mailchimp could not save this signup.',
            ], 400);
        }

        return new WP_REST_Response([
            'success' => true,
            'message' => 'You are on the list.',
        ], 200);
    }

    private function create_guesty_contact($data)
    {
        $token = $this->get_access_token();
        if (!$token) {
            return [
                'success' => false,
                'message' => 'Guesty authentication unavailable.',
            ];
        }

        $name_parts = preg_split('/\s+/', trim($data['name']));
        $first_name = array_shift($name_parts);
        $last_name = trim(implode(' ', $name_parts));

        $payload = [
            'firstName' => $first_name ?: $data['name'],
            'lastName' => $last_name,
            'email' => $data['email'],
            'emails' => [$data['email']],
            'phone' => $data['phone'],
            'phones' => $data['phone'] ? [$data['phone']] : [],
            'preferredContactMethod' => $data['phone'] ? 'email' : 'email',
            'notes' => sprintf(
                "Website contact inquiry\nReason: %s\n\nMessage:\n%s",
                $data['reason'],
                $data['message']
            ),
        ];

        $response = wp_remote_post($this->api_base . '/v1/contacts', [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            'body' => wp_json_encode($payload),
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            return [
                'success' => false,
                'message' => $response->get_error_message(),
            ];
        }

        $http_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        return [
            'success' => $http_code >= 200 && $http_code < 300,
            'message' => $body['message'] ?? $body['error']['message'] ?? '',
            'contactId' => $body['_id'] ?? null,
        ];
    }

    public function handle_contact_submission($request)
    {
        if ($this->is_rate_limited('contact_submission', 5)) {
            return new WP_Error('rate_limited', 'Too many contact attempts. Please try again shortly.', ['status' => 429]);
        }

        $params = $request->get_json_params();
        $honeypot = sanitize_text_field($params['website'] ?? '');
        if (!empty($honeypot)) {
            return new WP_REST_Response(['success' => true, 'message' => 'Message sent.'], 200);
        }

        $data = [
            'name' => sanitize_text_field($params['name'] ?? ''),
            'email' => sanitize_email($params['email'] ?? ''),
            'phone' => sanitize_text_field($params['phone'] ?? ''),
            'reason' => sanitize_text_field($params['reason'] ?? ''),
            'message' => sanitize_textarea_field($params['message'] ?? ''),
        ];

        if (empty($data['name']) || !is_email($data['email']) || empty($data['reason']) || empty($data['message'])) {
            return new WP_Error('missing_data', 'Name, email, reason, and message are required.', ['status' => 400]);
        }

        $guesty_result = $this->create_guesty_contact($data);
        $to = defined('CC_STAYS_CONTACT_EMAIL') ? CC_STAYS_CONTACT_EMAIL : get_option('cc_stays_contact_email', get_option('admin_email'));
        $subject = sprintf('New CC Stays inquiry: %s', $data['reason']);
        $body = sprintf(
            "Name: %s\nEmail: %s\nPhone: %s\nReason: %s\nGuesty contact: %s\n\nMessage:\n%s",
            $data['name'],
            $data['email'],
            $data['phone'] ?: 'Not provided',
            $data['reason'],
            !empty($guesty_result['contactId']) ? $guesty_result['contactId'] : ($guesty_result['success'] ? 'Created' : 'Not created'),
            $data['message']
        );
        $headers = [
            'Reply-To: ' . $data['name'] . ' <' . $data['email'] . '>',
        ];

        $mail_sent = wp_mail($to, $subject, $body, $headers);

        if (!$mail_sent && empty($guesty_result['success'])) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'We could not send the message. Please email us directly.',
            ], 500);
        }

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Message sent.',
            'guestyContactCreated' => !empty($guesty_result['success']),
        ], 200);
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
    public function render_amenities_widget($atts = [])
    {
        $post_id = $this->get_shortcode_property_id($atts);
        if (!$post_id && is_singular('properties')) {
            $post_id = get_the_ID();
        }

        if (!$post_id || get_post_type($post_id) !== 'properties') {
            return '';
        }

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
                has_shortcode($post->post_content, 'cc_stays_homepage_sections') ||
                has_shortcode($post->post_content, 'cc_stays_homepage_coastal') ||
                has_shortcode($post->post_content, 'cc_stays_homepage_revamp') ||
                has_shortcode($post->post_content, 'cc_stays_archive') ||
                has_shortcode($post->post_content, 'cc_stays_amenities') ||
                has_shortcode($post->post_content, 'cc_stays_about') ||
                has_shortcode($post->post_content, 'cc_stays_about_revamp') ||
                has_shortcode($post->post_content, 'cc_stays_journal') ||
                has_shortcode($post->post_content, 'cc_stays_journal_revamp') ||
                has_shortcode($post->post_content, 'cc_stays_contact') ||
                has_shortcode($post->post_content, 'cc_stays_contact_revamp') ||
                has_shortcode($post->post_content, 'cc_stays_destinations') ||
                has_shortcode($post->post_content, 'cc_stays_destinations_revamp') ||
                has_shortcode($post->post_content, 'cc_stays_experiences') ||
                has_shortcode($post->post_content, 'cc_stays_experiences_revamp') ||
                has_shortcode($post->post_content, 'cc_stays_property_revamp') ||
                has_shortcode($post->post_content, 'cc_stays_property_hero') ||
                has_shortcode($post->post_content, 'cc_stays_property_gallery') ||
                has_shortcode($post->post_content, 'cc_stays_property_overview') ||
                has_shortcode($post->post_content, 'cc_stays_property_about') ||
                has_shortcode($post->post_content, 'cc_stays_property_highlights') ||
                has_shortcode($post->post_content, 'cc_stays_property_sleep') ||
                has_shortcode($post->post_content, 'cc_stays_property_amenities') ||
                has_shortcode($post->post_content, 'cc_stays_property_booking') ||
                has_shortcode($post->post_content, 'cc_stays_property_reviews') ||
                has_shortcode($post->post_content, 'cc_stays_property_location') ||
                has_shortcode($post->post_content, 'cc_stays_property_rules') ||
                has_shortcode($post->post_content, 'cc_stays_property_cta')
            );
        }

        if (!is_singular('properties') && !is_page('checkout') && !is_front_page() && !is_page(['stays', 'properties', 'about', 'blog', 'journal', 'contact', 'destinations', 'experiences']) && !$has_homepage_shortcode) {
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
    public function render_dynamic_leaflet_map()
    {
        // Only run on single property pages
        if (!is_singular('properties'))
            return '';

        $post_id = get_the_ID();

        // Grab the coordinates we synced from Guesty
        $lat = floatval(get_post_meta($post_id, 'latitude', true));
        $lng = floatval(get_post_meta($post_id, 'longitude', true));

        if (!$lat || !$lng) {
            return '<p class="cc-listing-map-empty">Map location currently unavailable.</p>';
        }

        $delta = 0.012;
        $bbox = implode(',', [
            $lng - $delta,
            $lat - $delta,
            $lng + $delta,
            $lat + $delta,
        ]);
        $src = add_query_arg([
            'bbox' => $bbox,
            'layer' => 'mapnik',
            'marker' => $lat . ',' . $lng,
        ], 'https://www.openstreetmap.org/export/embed.html');
        $link = add_query_arg([
            'mlat' => $lat,
            'mlon' => $lng,
        ], 'https://www.openstreetmap.org/') . '#map=15/' . $lat . '/' . $lng;

        return sprintf(
            '<div class="cc-listing-map-embed" style="position:relative;overflow:hidden;width:100%%;height:min(460px,70vh);border-radius:8px;background:#ede7db;"><iframe title="%s map" src="%s" width="100%%" height="100%%" loading="lazy" referrerpolicy="no-referrer-when-downgrade" style="position:absolute;inset:0;width:100%%;height:100%%;border:0;"></iframe></div><p class="cc-listing-map-link" style="margin-top:10px;"><a href="%s" target="_blank" rel="noopener">Open map</a></p>',
            esc_attr(get_the_title($post_id)),
            esc_url($src),
            esc_url($link)
        );
    }

    public function render_search_bar_widget()
    {
        return '<div id="cc-stays-react-search-bar"></div>';
    }

    public function render_homepage_sections_widget($atts = [])
    {
        $atts = shortcode_atts([
            'home_url' => '/',
            'stays_url' => '/stays',
            'book_direct_url' => '/about',
            'reviews_url' => '/reviews',
            'about_url' => '/about',
            'owners_url' => 'https://ccstays.guestyowners.com/',
            'faq_url' => '/list-with-us/#faq',
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
            'logo' => 'https://ccstays.com/wp-content/uploads/2026/08/CC_Stays_logo.png',
            'hero' => 'https://ccstays.com/wp-content/uploads/2026/03/ZDWUJy55RE2qNR5ucgho_MMVid111-v.mp4',
            'cardOne' => 'https://ccstays.com/wp-content/uploads/2026/07/villa-ban-5.jpg',
            'cardTwo' => 'https://ccstays.com/wp-content/uploads/2026/04/Bamboo-1-43.png',
            'cardThree' => 'https://ccstays.com/wp-content/uploads/2026/04/Manatee-1-40.png',
            'detail' => 'https://ccstays.com/wp-content/uploads/2026/04/Casa-Palma-1-6.png',
            'standard' => 'https://ccstays.com/wp-content/uploads/2026/04/Isles-Villa-11.png',
            'manage' => $image_base . 'cc-hero-evening-bikes.jpg',
            'hostTeaser' => $image_base . 'cc-hero-sunset-pool.jpg',
            'hosts' => $image_base . 'cc-welcome-tray.jpg',
            'final' => 'https://ccstays.com/wp-content/uploads/2026/04/Isles-Villa-8.png',
            'reviewOne' => $image_base . 'villa-banana-loungers.jpg',
            'reviewTwo' => $image_base . 'villa-banana-game-room.jpg',
            'reviewThree' => $image_base . 'villa-banana-bathroom.jpg',
        ];

        return '<div class="cc-stays-react-homepage" data-links="' . esc_attr(wp_json_encode($links)) . '" data-images="' . esc_attr(wp_json_encode($images)) . '"></div>';
    }

    public function render_homepage_coastal_widget($atts = [])
    {
        $atts = shortcode_atts([
            'home_url' => '/',
            'stays_url' => '/stays',
            'book_direct_url' => '/about',
            'reviews_url' => '/reviews',
            'about_url' => '/about',
            'owners_url' => 'https://ccstays.guestyowners.com/',
            'faq_url' => '/faq',
            'contact_url' => '/contact',
        ], $atts, 'cc_stays_homepage_coastal');

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
            'logo' => 'https://ccstays.com/wp-content/uploads/2026/08/CC_Stays_logo.png',
            'hero' => 'https://ccstays.com/wp-content/uploads/2026/03/ZDWUJy55RE2qNR5ucgho_MMVid111-v.mp4',
            'cardOne' => 'https://ccstays.com/wp-content/uploads/2026/07/villa-ban-5.jpg',
            'cardTwo' => 'https://ccstays.com/wp-content/uploads/2026/04/Bamboo-1-43.png',
            'cardThree' => 'https://ccstays.com/wp-content/uploads/2026/04/Manatee-1-40.png',
            'detail' => 'https://ccstays.com/wp-content/uploads/2026/04/Casa-Palma-1-6.png',
            'standard' => 'https://ccstays.com/wp-content/uploads/2026/04/Isles-Villa-11.png',
            'hosts' => $image_base . 'cc-welcome-tray.jpg',
            'final' => 'https://ccstays.com/wp-content/uploads/2026/04/Isles-Villa-8.png',
            'reviewOne' => $image_base . 'villa-banana-loungers.jpg',
            'reviewTwo' => $image_base . 'villa-banana-game-room.jpg',
            'reviewThree' => $image_base . 'villa-banana-bathroom.jpg',
        ];

        return '<div class="cc-stays-react-homepage-coastal" data-links="' . esc_attr(wp_json_encode($links)) . '" data-images="' . esc_attr(wp_json_encode($images)) . '"></div>';
    }

    public function render_homepage_revamp_widget($atts = [])
    {
        $atts = shortcode_atts([
            'home_url' => '/',
            'stays_url' => '/stays',
            'about_url' => '/about',
            'contact_url' => '/contact',
            'owners_url' => 'https://ccstays.guestyowners.com/',
            'partner_url' => 'https://partners.ccstays.com/',
            'privacy_url' => '/privacy-policy',
            'terms_url' => '/terms',
            'accessibility_url' => '/accessibility',
            'instagram_url' => 'https://www.instagram.com/ccstays',
        ], $atts, 'cc_stays_homepage_revamp');

        $links = [
            'home' => esc_url_raw($atts['home_url']),
            'stays' => esc_url_raw($atts['stays_url']),
            'about' => esc_url_raw($atts['about_url']),
            'contact' => esc_url_raw($atts['contact_url']),
            'owners' => esc_url_raw($atts['owners_url']),
            'partner' => esc_url_raw($atts['partner_url']),
            'privacy' => esc_url_raw($atts['privacy_url']),
            'terms' => esc_url_raw($atts['terms_url']),
            'accessibility' => esc_url_raw($atts['accessibility_url']),
            'instagram' => esc_url_raw($atts['instagram_url']),
        ];

        $asset_base = plugin_dir_url(__FILE__) . 'assets/';
        $image_base = $asset_base . 'home/';
        $images = [
            'logo' => 'https://ccstays.com/wp-content/uploads/2026/08/CC_Stays_logo.png',
            'hero' => 'https://ccstays.com/wp-content/uploads/2026/03/ZDWUJy55RE2qNR5ucgho_MMVid111-v.mp4',
            'storyOne' => 'https://ccstays.com/wp-content/uploads/2026/08/ccright.jpeg',
            'storyTwo' => 'https://ccstays.com/wp-content/uploads/2026/04/Casa-Palma-1-31.png',
            'storyInset' => 'https://ccstays.com/wp-content/uploads/2026/07/71BBE3AA-BE2C-4D05-8E98-150181B7DC9F-2.jpg',
            'storyThree' => 'https://ccstays.com/wp-content/uploads/2026/07/9.jpg',
            'propertyImages' => [
                'bamboo' => [
                    'https://ccstays.com/wp-content/uploads/2026/04/Bamboo-1-43.png',
                    $image_base . 'villa-banana-kitchen.jpg',
                    $image_base . 'cc-welcome-tray.jpg',
                ],
                'hidden' => [
                    $image_base . 'cc-hero-sunset-pool.jpg',
                    $image_base . 'cc-living-room-mural.jpg',
                    $image_base . 'cc-outdoor-guests-dining.jpg',
                ],
                'villa' => [
                    $image_base . 'villa-banana-pool-exterior.jpg',
                    $image_base . 'villa-banana-pool-lounge.jpg',
                    $image_base . 'villa-banana-game-room.jpg',
                ],
                'manatee' => [
                    'https://ccstays.com/wp-content/uploads/2026/04/Manatee-1-40.png',
                    $image_base . 'cc-bedroom-lamp-detail.jpg',
                    $image_base . 'cc-bedroom-green-tray.jpg',
                ],
            ],
        ];

        return '<div class="cc-stays-react-homepage-revamp" data-links="' . esc_attr(wp_json_encode($links)) . '" data-images="' . esc_attr(wp_json_encode($images)) . '"></div>';
    }

    private function get_revamp_links($atts, $shortcode)
    {
        $atts = shortcode_atts([
            'home_url' => '/',
            'stays_url' => '/stays',
            'destinations_url' => '/destinations',
            'experiences_url' => '/experiences',
            'about_url' => '/about',
            'journal_url' => '/journal',
            'contact_url' => '/contact',
            'owners_url' => 'https://ccstays.guestyowners.com/',
            'partner_url' => 'https://partners.ccstays.com/',
            'privacy_url' => '/privacy-policy',
            'terms_url' => '/terms',
            'accessibility_url' => '/accessibility',
            'instagram_url' => 'https://www.instagram.com/ccstays',
        ], $atts, $shortcode);

        return [
            'home' => esc_url_raw($atts['home_url']),
            'stays' => esc_url_raw($atts['stays_url']),
            'destinations' => esc_url_raw($atts['destinations_url']),
            'experiences' => esc_url_raw($atts['experiences_url']),
            'about' => esc_url_raw($atts['about_url']),
            'journal' => esc_url_raw($atts['journal_url']),
            'contact' => esc_url_raw($atts['contact_url']),
            'owners' => esc_url_raw($atts['owners_url']),
            'partner' => esc_url_raw($atts['partner_url']),
            'privacy' => esc_url_raw($atts['privacy_url']),
            'terms' => esc_url_raw($atts['terms_url']),
            'accessibility' => esc_url_raw($atts['accessibility_url']),
            'instagram' => esc_url_raw($atts['instagram_url']),
        ];
    }

    private function get_revamp_images()
    {
        $image_base = plugin_dir_url(__FILE__) . 'assets/home/';

        return [
            'logo' => 'https://ccstays.com/wp-content/uploads/2026/08/CC_Stays_logo.png',
            'hero' => 'https://ccstays.com/wp-content/uploads/2026/03/ZDWUJy55RE2qNR5ucgho_MMVid111-v.mp4',
            'storyOne' => 'https://ccstays.com/wp-content/uploads/2026/08/ccright.jpeg',
            'storyTwo' => 'https://ccstays.com/wp-content/uploads/2026/04/Casa-Palma-1-31.png',
            'storyInset' => 'https://ccstays.com/wp-content/uploads/2026/07/71BBE3AA-BE2C-4D05-8E98-150181B7DC9F-2.jpg',
            'storyThree' => 'https://ccstays.com/wp-content/uploads/2026/07/9.jpg',
            'journalOne' => 'https://ccstays.com/wp-content/uploads/2026/04/Bamboo-1-43.png',
            'journalTwo' => 'https://ccstays.com/wp-content/uploads/2026/04/Isles-Villa-8.png',
            'journalThree' => 'https://ccstays.com/wp-content/uploads/2026/07/villa-ban-5.jpg',
            'propertyImages' => [
                'bamboo' => [
                    'https://ccstays.com/wp-content/uploads/2026/04/Bamboo-1-43.png',
                    'https://ccstays.com/wp-content/uploads/2026/08/ccright.jpeg',
                    'https://ccstays.com/wp-content/uploads/2026/07/71BBE3AA-BE2C-4D05-8E98-150181B7DC9F-2.jpg',
                ],
                'hidden' => [
                    'https://ccstays.com/wp-content/uploads/2026/04/Isles-Villa-3.png',
                    'https://ccstays.com/wp-content/uploads/2026/04/Isles-Villa-8.png',
                    'https://ccstays.com/wp-content/uploads/2026/04/Isles-Villa-11.png',
                ],
                'villa' => [
                    'https://ccstays.com/wp-content/uploads/2026/07/villa-ban-5.jpg',
                    $image_base . 'villa-banana-pool-exterior.jpg',
                    $image_base . 'villa-banana-game-room.jpg',
                ],
                'manatee' => [
                    'https://ccstays.com/wp-content/uploads/2026/04/Manatee-1-40.png',
                    'https://ccstays.com/wp-content/uploads/2026/04/Casa-Palma-1-31.png',
                    'https://ccstays.com/wp-content/uploads/2026/04/Casa-Palma-1-6.png',
                ],
            ],
        ];
    }

    public function render_stays_archive_widget($atts = [])
    {
        $links = $this->get_revamp_links($atts, 'cc_stays_archive');
        $images = $this->get_revamp_images();

        return '<div id="cc-stays-react-archive" data-links="' . esc_attr(wp_json_encode($links)) . '" data-images="' . esc_attr(wp_json_encode($images)) . '"></div>';
    }

    public function render_about_page_widget($atts = [])
    {
        $links = $this->get_revamp_links($atts, 'cc_stays_about');
        $images = $this->get_revamp_images();

        return '<div class="cc-stays-react-about" data-links="' . esc_attr(wp_json_encode($links)) . '" data-images="' . esc_attr(wp_json_encode($images)) . '"></div>';
    }

    public function render_journal_page_widget($atts = [])
    {
        $links = $this->get_revamp_links($atts, 'cc_stays_journal');
        $images = $this->get_revamp_images();

        return '<div class="cc-stays-react-journal" data-links="' . esc_attr(wp_json_encode($links)) . '" data-images="' . esc_attr(wp_json_encode($images)) . '"></div>';
    }

    public function render_contact_page_widget($atts = [])
    {
        $links = $this->get_revamp_links($atts, 'cc_stays_contact');
        $images = $this->get_revamp_images();

        return '<div class="cc-stays-react-contact" data-links="' . esc_attr(wp_json_encode($links)) . '" data-images="' . esc_attr(wp_json_encode($images)) . '"></div>';
    }

    public function render_destinations_page_widget($atts = [])
    {
        $links = $this->get_revamp_links($atts, 'cc_stays_destinations');
        $images = $this->get_revamp_images();

        return '<div class="cc-stays-react-destinations" data-links="' . esc_attr(wp_json_encode($links)) . '" data-images="' . esc_attr(wp_json_encode($images)) . '"></div>';
    }

    public function render_experiences_page_widget($atts = [])
    {
        $links = $this->get_revamp_links($atts, 'cc_stays_experiences');
        $images = $this->get_revamp_images();

        return '<div class="cc-stays-react-experiences" data-links="' . esc_attr(wp_json_encode($links)) . '" data-images="' . esc_attr(wp_json_encode($images)) . '"></div>';
    }

    private function get_shortcode_property_id($atts = [])
    {
        $atts = shortcode_atts([
            'post_id' => 0,
            'id' => 0,
        ], $atts);

        $post_id = absint($atts['post_id'] ?: $atts['id']);
        if ($post_id) {
            return $post_id;
        }

        if (is_singular('properties')) {
            return get_the_ID();
        }

        return 0;
    }

    private function cc_get_meta_first($post_id, $keys, $fallback = '')
    {
        foreach ($keys as $key) {
            if (function_exists('get_field')) {
                $acf_value = get_field($key, $post_id);
                if ($acf_value !== false && $acf_value !== '' && $acf_value !== null && $acf_value !== []) {
                    return $acf_value;
                }
            }

            $value = get_post_meta($post_id, $key, true);
            if ($value !== '' && $value !== null && $value !== []) {
                return $value;
            }
        }

        return $fallback;
    }

    private function cc_get_meta_array($post_id, $keys, $fallback = [])
    {
        $value = $this->cc_get_meta_first($post_id, $keys, null);
        if ($value === null || $value === '') {
            return $fallback;
        }

        if (is_array($value)) {
            return array_values(array_filter($value));
        }

        $decoded = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return array_values(array_filter($decoded));
        }

        if (is_string($value)) {
            return array_values(array_filter(array_map('trim', preg_split('/[\r\n]+/', $value))));
        }

        return $fallback;
    }

    private function cc_normalize_meta_row($row, $columns = [])
    {
        if (!is_array($row)) {
            return [];
        }

        $item = [];
        foreach ($columns as $index => $column) {
            $value = $row[$column] ?? $row[$index] ?? '';

            if ($column === 'title') {
                $value = $value ?: ($row['heading'] ?? $row['label'] ?? $row['name'] ?? '');
            } elseif ($column === 'copy') {
                $value = $value ?: ($row['description'] ?? $row['text'] ?? $row['content'] ?? '');
            } elseif ($column === 'icon') {
                $value = $value ?: ($row['icon_name'] ?? $row['icon_slug'] ?? '');
            }

            if (is_array($value)) {
                $value = $value['value'] ?? $value['label'] ?? $value['url'] ?? '';
            }

            $item[$column] = is_scalar($value) ? trim((string) $value) : '';
        }

        return array_filter($item) ? $item : [];
    }

    private function cc_normalize_meta_rows($rows, $columns = [])
    {
        $items = [];
        foreach ((array) $rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $item = $this->cc_normalize_meta_row($row, $columns);
            if (!empty($item)) {
                $items[] = $item;
            }
        }

        return $items;
    }

    private function cc_get_meta_rows($post_id, $keys, $fallback = [], $columns = [])
    {
        $value = $this->cc_get_meta_first($post_id, $keys, null);
        if ($value === null || $value === '') {
            return $fallback;
        }

        if (is_array($value)) {
            $items = $this->cc_normalize_meta_rows($value, $columns);
            return $items ?: $fallback;
        }

        $decoded = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $items = $this->cc_normalize_meta_rows($decoded, $columns);
            return $items ?: $fallback;
        }

        if (is_numeric($value)) {
            return $fallback;
        }

        $rows = array_filter(array_map('trim', preg_split('/[\r\n]+/', (string) $value)));
        $items = [];
        foreach ($rows as $row) {
            $parts = array_map('trim', explode('|', $row));
            $item = [];
            foreach ($columns as $index => $column) {
                $item[$column] = $parts[$index] ?? '';
            }
            if (!empty(array_filter($item))) {
                $items[] = $item;
            }
        }

        return $items ?: $fallback;
    }

    private function cc_get_image_url_from_value($image)
    {
        if (is_array($image)) {
            $image = $image['url'] ?? $image['src'] ?? $image['original'] ?? $image['sizes']['large'] ?? $image['ID'] ?? $image['id'] ?? '';
        }

        if (is_numeric($image)) {
            $image = wp_get_attachment_image_url((int) $image, 'full');
        }

        return $image && filter_var($image, FILTER_VALIDATE_URL) ? esc_url_raw($image) : '';
    }

    private function cc_get_property_gallery_box_images($post_id)
    {
        $images = [];

        for ($index = 1; $index <= 4; $index++) {
            $image = $this->cc_get_meta_first($post_id, [
                'cc_property_image_' . $index,
                'property_image_' . $index,
                'gallery_image_' . $index,
                'image_' . $index,
            ], '');

            $url = $this->cc_get_image_url_from_value($image);
            if ($url) {
                $images[] = $url;
            }
        }

        return $images;
    }

    private function get_section_property_gallery($post_id)
    {
        $gallery = $this->cc_get_meta_array($post_id, ['cc_property_gallery', 'property_gallery', 'guesty_images'], []);
        $featured = get_the_post_thumbnail_url($post_id, 'full');
        $box_images = $this->cc_get_property_gallery_box_images($post_id);

        $fallback_gallery = [];
        foreach ($gallery as $image) {
            $url = $this->cc_get_image_url_from_value($image);
            if ($url) {
                $fallback_gallery[] = $url;
            }
        }

        $primary = $featured ?: ($fallback_gallery[0] ?? ($box_images[0] ?? ''));
        $images = $box_images ? array_merge([$primary], $box_images) : array_merge([$primary], $fallback_gallery);

        return array_values(array_unique(array_filter($images)));
    }

    private function cc_get_property_sleeping_rows($post_id, $bedrooms, $fallback = [])
    {
        $row_data = $this->cc_get_meta_rows($post_id, ['cc_property_sleeping', 'property_sleeping'], [], ['name', 'bed', 'image']);
        if (!empty($row_data)) {
            return array_map(function ($row) {
                $row['image'] = $this->cc_get_image_url_from_value($row['image'] ?? '');
                return $row;
            }, $row_data);
        }

        $rooms = [];
        $limit = max(1, min(12, (int) $bedrooms ?: 1));
        for ($index = 1; $index <= $limit; $index++) {
            $image = $this->cc_get_meta_first($post_id, [
                'bedroom_' . $index,
                'bedroom_' . $index . '_image',
                'cc_property_bedroom_' . $index,
                'property_bedroom_' . $index,
            ], '');
            $name = $this->cc_get_meta_first($post_id, [
                'bedroom_' . $index . '_name',
                'bedroom_' . $index . '_title',
                'bedroom_' . $index . '_label',
            ], '');
            $bed = $this->cc_get_meta_first($post_id, [
                'bedroom_' . $index . '_bed',
                'bedroom_' . $index . '_beds',
                'bedroom_' . $index . '_description',
            ], '');

            $image_url = $this->cc_get_image_url_from_value($image);
            if ($image_url || $name || $bed) {
                $rooms[] = [
                    'name' => $name ?: 'Bedroom ' . $index,
                    'bed' => $bed ?: 'Comfortable bed',
                    'image' => $image_url,
                ];
            }
        }

        return $rooms ?: $fallback;
    }

    private function get_property_section_data($post_id)
    {
        if (!$post_id || get_post_type($post_id) !== 'properties') {
            return null;
        }

        $bedrooms = (int) (get_post_meta($post_id, 'bedrooms', true) ?: 1);
        $description = trim(wp_strip_all_tags(get_post_field('post_content', $post_id)));
        $reviews = $this->cc_get_meta_rows($post_id, ['cc_property_reviews', 'property_reviews'], [], ['name', 'date', 'quote', 'rating']);
        $fallback_highlights = [
            ['title' => 'Designed for the stay', 'copy' => 'Spaces arranged for settling in, gathering, and unwinding.', 'icon' => 'sparkle'],
            ['title' => 'Ready when you arrive', 'copy' => 'Smooth check-in, clear instructions, and essentials in place.', 'icon' => 'key'],
            ['title' => 'Help when you need it', 'copy' => 'Local support before and during your trip.', 'icon' => 'bell'],
        ];
        $fallback_sleeping = [];
        for ($index = 1; $index <= max(1, $bedrooms); $index++) {
            $fallback_sleeping[] = ['name' => 'Bedroom ' . $index, 'bed' => 'Comfortable bed', 'image' => ''];
        }

        return [
            'id' => $post_id,
            'title' => get_the_title($post_id),
            'url' => get_permalink($post_id),
            'listing_id' => get_post_meta($post_id, 'guesty_listing_id', true),
            'city' => get_post_meta($post_id, 'location_city', true) ?: '',
            'region' => $this->cc_get_meta_first($post_id, ['location_region', 'location_state', 'state'], ''),
            'subtitle' => $this->cc_get_meta_first($post_id, ['cc_property_subtitle', 'property_subtitle'], ''),
            'intro' => $this->cc_get_meta_first($post_id, ['cc_property_intro', 'property_intro'], $description),
            'description' => $description,
            'gallery' => $this->get_section_property_gallery($post_id),
            'guests' => (int) (get_post_meta($post_id, 'guests', true) ?: 2),
            'bedrooms' => $bedrooms,
            'beds' => (int) ($this->cc_get_meta_first($post_id, ['cc_property_beds', 'beds'], $bedrooms) ?: $bedrooms),
            'bathrooms' => get_post_meta($post_id, 'bathrooms', true) ?: 1,
            'nightly_rate' => get_post_meta($post_id, 'nightly_rate', true) ?: '',
            'min_nights' => get_post_meta($post_id, 'min_nights', true) ?: '2',
            'rating' => $this->cc_get_meta_first($post_id, ['cc_property_rating', 'rating', 'review_rating'], ''),
            'review_count' => (int) ($this->cc_get_meta_first($post_id, ['cc_property_review_count', 'review_count'], count($reviews)) ?: count($reviews)),
            'highlights' => $this->cc_get_meta_rows($post_id, ['cc_property_highlights', 'property_highlights'], $fallback_highlights, ['title', 'copy', 'icon']),
            'sleeping' => $this->cc_get_property_sleeping_rows($post_id, $bedrooms, $fallback_sleeping),
            'reviews' => $reviews,
            'lat' => floatval(get_post_meta($post_id, 'latitude', true)),
            'lng' => floatval(get_post_meta($post_id, 'longitude', true)),
            'location_blurb' => $this->cc_get_meta_first($post_id, ['cc_property_location_blurb', 'property_location_blurb'], 'The exact address is shared after booking.'),
            'location_notes' => $this->cc_get_meta_rows($post_id, ['cc_property_location_notes', 'property_location_notes'], [], ['title', 'detail']),
            'rules' => $this->cc_get_meta_array($post_id, ['cc_property_rules', 'property_rules'], ['Check-in after 4:00 PM', 'Checkout before 10:00 AM', 'No smoking']),
            'safety' => $this->cc_get_meta_array($post_id, ['cc_property_safety', 'property_safety'], ['Smoke alarm', 'Carbon monoxide alarm']),
            'cancellation' => $this->cc_get_meta_first($post_id, ['cc_property_cancellation', 'property_cancellation'], 'Cancellation terms are shown during checkout before you request to book.'),
            'license' => $this->cc_get_meta_first($post_id, ['cc_property_license', 'property_license'], ''),
        ];
    }

    private function property_missing_shortcode_message()
    {
        return '<p class="cc-property-section-note">This property section needs to be placed on a single property page.</p>';
    }

    private function property_stat_label($value, $singular, $plural = '')
    {
        $number = floatval($value);
        $label = ($number == 1.0) ? $singular : ($plural ?: $singular . 's');
        return esc_html($value . ' ' . $label);
    }

    private function property_location_label($property)
    {
        return esc_html(implode(', ', array_filter([$property['city'], $property['region']])));
    }

    private function property_short_title($title)
    {
        $words = preg_split('/\s+/', trim(wp_strip_all_tags((string) $title)));
        $words = array_values(array_filter($words, 'strlen'));

        if (count($words) <= 2) {
            return trim((string) $title);
        }

        return implode(' ', array_slice($words, 0, 2));
    }

    private function render_property_read_more($content)
    {
        $content = trim((string) $content);
        if ($content === '') {
            return '';
        }

        return '<div class="cc-property-read-more" data-expanded="false"><div class="cc-property-read-more-copy">' . wp_kses_post(wpautop($content)) . '</div><button type="button" class="cc-property-read-more-toggle" aria-expanded="false">Read more →</button></div>' . $this->property_read_more_script();
    }

    private function property_read_more_script()
    {
        return '<script>(function(){if(window.ccPropertyReadMoreReady)return;window.ccPropertyReadMoreReady=true;function refresh(){document.querySelectorAll(".cc-property-read-more").forEach(function(root){var copy=root.querySelector(".cc-property-read-more-copy");var button=root.querySelector(".cc-property-read-more-toggle");if(!copy||!button)return;button.hidden=copy.scrollHeight<=copy.clientHeight+2;});}document.addEventListener("click",function(event){var button=event.target.closest(".cc-property-read-more-toggle");if(!button)return;var root=button.closest(".cc-property-read-more");if(!root)return;var expanded=root.getAttribute("data-expanded")==="true";root.setAttribute("data-expanded",expanded?"false":"true");button.setAttribute("aria-expanded",expanded?"false":"true");button.textContent=expanded?"Read more →":"Show less";});if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",refresh);}else{requestAnimationFrame(refresh);}window.addEventListener("resize",refresh);})();</script>';
    }

    private function property_promise_modal()
    {
        ob_start();
        ?>
        <div class="cc-property-promise-modal" data-promise-modal hidden>
            <div class="cc-property-promise-backdrop" data-promise-close></div>
            <div class="panel" role="dialog" aria-modal="true" aria-labelledby="cc-property-promise-title">
                <button class="modal-close" type="button" data-promise-close aria-label="Close">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                        aria-hidden="true">
                        <path d="M5 5l14 14M19 5L5 19"></path>
                    </svg>
                </button>
                <h3 id="cc-property-promise-title">The CC Stays Promise</h3>
                <p class="muted">Book with confidence.</p>
                <div class="cc-property-promise-list">
                    <div><b>A home ready for you</b>
                        <p class="muted">We prepare and check the residence before arrival so you can settle in immediately.</p>
                    </div>
                    <div><b>What you booked is what you should expect</b>
                        <p class="muted">The listing, major amenities, and property information should accurately represent the
                            home you reserved.</p>
                    </div>
                    <div><b>Real help during your stay</b>
                        <p class="muted">Our concierge is available when you need recommendations, help with the residence, or
                            support during your trip.</p>
                    </div>
                    <div><b>If something isn't right</b>
                        <p class="muted">Tell us. We'll respond and work to make it right.</p>
                    </div>
                </div>
            </div>
        </div>
        <script>(function () { if (window.ccPropertyPromiseReady) return; window.ccPropertyPromiseReady = true; var lastTrigger = null; function modal() { return document.querySelector("[data-promise-modal]"); } function open(trigger) { var root = modal(); if (!root) return; lastTrigger = trigger; root.hidden = false; document.documentElement.classList.add("cc-property-promise-open"); var close = root.querySelector("[data-promise-close]"); if (close) close.focus(); } function close() { var root = modal(); if (!root || root.hidden) return; root.hidden = true; document.documentElement.classList.remove("cc-property-promise-open"); if (lastTrigger && lastTrigger.focus) lastTrigger.focus(); } document.addEventListener("click", function (event) { var opener = event.target.closest("[data-promise-open]"); if (opener) { event.preventDefault(); open(opener); return; } if (event.target.closest("[data-promise-close]")) { event.preventDefault(); close(); } }); document.addEventListener("keydown", function (event) { if (event.key === "Escape") close(); }); })();</script>
        <?php
        return ob_get_clean();
    }

    private function property_icon_svg($name = 'sparkle')
    {
        $icons = [
            'key' => '<circle cx="8" cy="15" r="3"/><path d="m10.2 12.8 7-7"/><path d="m15.5 7.5 2 2"/><path d="m13.7 9.3 2 2"/>',
            'bell' => '<path d="M6.8 10.5a5.2 5.2 0 0 1 10.4 0c0 5 2 5.8 2 5.8H4.8s2-.8 2-5.8Z"/><path d="M10 19a2.2 2.2 0 0 0 4 0"/>',
            'home' => '<path d="m3.5 11 8.5-7 8.5 7"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M10 20v-5h4v5"/>',
            'bed' => '<path d="M4 11V5"/><path d="M20 13v6"/><path d="M4 19v-8h12a4 4 0 0 1 4 4v4"/><path d="M4 15h16"/><path d="M7 9h4"/>',
            'waves' => '<path d="M3 8c2.2 0 2.2 1.7 4.4 1.7S9.6 8 11.8 8s2.2 1.7 4.4 1.7S18.4 8 21 8"/><path d="M3 13c2.2 0 2.2 1.7 4.4 1.7s2.2-1.7 4.4-1.7 2.2 1.7 4.4 1.7S18.4 13 21 13"/><path d="M3 18c2.2 0 2.2 1.7 4.4 1.7s2.2-1.7 4.4-1.7 2.2 1.7 4.4 1.7S18.4 18 21 18"/>',
            'sofa' => '<path d="M7 11V8a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v3"/><path d="M5 12h14a2.5 2.5 0 0 1 2.5 2.5V19h-19v-4.5A2.5 2.5 0 0 1 5 12Z"/><path d="M4 19v2"/><path d="M20 19v2"/><path d="M7 12v4"/><path d="M17 12v4"/>',
            'sun' => '<circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v3"/><path d="M12 18.5v3"/><path d="M2.5 12h3"/><path d="M18.5 12h3"/><path d="m5.3 5.3 2.1 2.1"/><path d="m16.6 16.6 2.1 2.1"/><path d="m18.7 5.3-2.1 2.1"/><path d="m7.4 16.6-2.1 2.1"/>',
            'pool' => '<path d="M8 15V6a3 3 0 0 1 6 0"/><path d="M14 15V6a3 3 0 0 1 6 0"/><path d="M6 11h14"/><path d="M6 15h14"/><path d="M3 19c2.2 0 2.2 1.6 4.4 1.6s2.2-1.6 4.4-1.6 2.2 1.6 4.4 1.6S18.4 19 21 19"/>',
            'utensils' => '<path d="M7 4v8"/><path d="M11 4v8"/><path d="M9 4v17"/><path d="M17 4c2.3 1.7 3.5 4.5 3.5 8.5H17V21"/>',
            'map-pin' => '<path d="M19 10.5c0 5.2-7 10.5-7 10.5S5 15.7 5 10.5a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10.5" r="2.2"/>',
            'target' => '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.2"/><path d="M12 5V3"/><path d="M12 21v-2"/><path d="M5 12H3"/><path d="M21 12h-2"/>',
            'flag' => '<path d="M8 21V4"/><path d="M8 5h9l-1.6 3L17 11H8"/><path d="M6 21h4"/>',
            'sparkle' => '<path d="M12 3.5 14.1 9l5.4 2-5.4 2L12 18.5 9.9 13l-5.4-2 5.4-2L12 3.5Z"/><path d="M18 4v3"/><path d="M19.5 5.5h-3"/>',
        ];
        $aliases = [
            'water' => 'waves',
            'waterfront' => 'waves',
            'wave' => 'waves',
            'couch' => 'sofa',
            'comfort' => 'sofa',
            'sunset' => 'sun',
            'sunny' => 'sun',
            'swimming' => 'pool',
            'heated-pool' => 'pool',
            'dining' => 'utensils',
            'outdoor-dining' => 'utensils',
            'pizza' => 'utensils',
            'location' => 'map-pin',
            'pin' => 'map-pin',
            'map' => 'map-pin',
            'pool-table' => 'target',
            'game' => 'target',
            'games' => 'target',
            'putt' => 'flag',
            'putt-putt' => 'flag',
            'golf' => 'flag',
        ];
        $name = strtolower(trim((string) $name));
        $name = str_replace([' ', '_'], '-', $name);
        $name = $aliases[$name] ?? $name;

        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . ($icons[$name] ?? $icons['sparkle']) . '</svg>';
    }

    private function property_amenity_icon_key($label)
    {
        $label = strtolower(trim((string) $label));

        $matches = [
            'waves' => ['water', 'waterfront', 'dock', 'lake', 'pond', 'river'],
            'pool' => ['pool', 'swim', 'hot tub', 'jacuzzi'],
            'utensils' => ['kitchen', 'dining', 'dinnerware', 'dish', 'grill', 'bbq', 'barbecue', 'oven', 'stove', 'microwave', 'refrigerator', 'freezer', 'toaster', 'blender', 'coffee', 'espresso', 'cookware', 'baking'],
            'sofa' => ['sofa', 'couch', 'living', 'lounge', 'workspace', 'chair'],
            'bed' => ['bed', 'linen', 'pillow', 'blanket', 'sleep'],
            'sun' => ['sun', 'patio', 'outdoor', 'balcony', 'yard', 'garden', 'beach', 'essentials'],
            'bell' => ['alarm', 'detector', 'security', 'camera', 'smoke', 'carbon', 'safe'],
            'home' => ['air conditioning', 'air-conditioning', 'heat', 'heating', 'fan', 'washer', 'dryer', 'laundry', 'cleaning', 'shampoo', 'conditioner', 'soap', 'towel', 'bath', 'bathtub', 'shower', 'wifi', 'wi-fi', 'internet', 'tv', 'parking'],
            'flag' => ['golf', 'putt', 'putting'],
            'target' => ['game', 'arcade', 'pool table', 'ping pong', 'board game'],
            'map-pin' => ['location', 'central', 'minutes'],
        ];

        foreach ($matches as $icon => $needles) {
            foreach ($needles as $needle) {
                if ($needle !== '' && strpos($label, $needle) !== false) {
                    return $icon;
                }
            }
        }

        return 'sparkle';
    }

    public function render_property_hero_section($atts = [])
    {
        $property = $this->get_property_section_data($this->get_shortcode_property_id($atts));
        if (!$property) {
            return $this->property_missing_shortcode_message();
        }

        ob_start();
        ?>
        <section class="cc-property-section-shell cc-property-hero-section">
            <div>
                <p class="cc-property-eyebrow">CC Stays Residence</p>
                <h1><?php echo esc_html($this->property_short_title($property['title'])); ?></h1>
                <p class="cc-property-location-line"><?php echo $this->property_location_label($property); ?></p>
                <p class="cc-property-stat-line">
                    <?php echo $this->property_stat_label($property['guests'], 'guest'); ?> ·
                    <?php echo $this->property_stat_label($property['bedrooms'], 'bedroom'); ?> ·
                    <?php echo $this->property_stat_label($property['beds'], 'bed'); ?> ·
                    <?php echo $this->property_stat_label($property['bathrooms'], 'bath'); ?>
                </p>
            </div>
            <?php if ($property['rating']): ?>
                <span class="cc-property-rating-pill">★ <?php echo esc_html($property['rating']); ?></span>
            <?php endif; ?>
        </section>
        <?php
        return ob_get_clean();
    }

    public function render_property_gallery_section($atts = [])
    {
        $property = $this->get_property_section_data($this->get_shortcode_property_id($atts));
        if (!$property) {
            return $this->property_missing_shortcode_message();
        }
        $images = $property['gallery'];
        if (empty($images)) {
            $images = ['https://via.placeholder.com/1400x900?text=CC+Stays'];
        }
        $visible = array_slice(array_pad($images, 5, $images[0]), 0, 5);

        ob_start();
        ?>
        <section class="cc-property-section-shell">
            <div class="cc-property-gallery-grid">
                <?php foreach ($visible as $index => $image): ?>
                    <a class="<?php echo $index === 0 ? 'primary' : ''; ?>" href="<?php echo esc_url($image); ?>" target="_blank"
                        rel="noopener">
                        <img src="<?php echo esc_url($image); ?>" alt="" loading="<?php echo $index === 0 ? 'eager' : 'lazy'; ?>">
                    </a>
                <?php endforeach; ?>
                <a class="cc-property-gallery-button" href="<?php echo esc_url($visible[0]); ?>" target="_blank"
                    rel="noopener">Show photos</a>
            </div>
        </section>
        <?php
        return ob_get_clean();
    }

    public function render_property_overview_section($atts = [])
    {
        $property = $this->get_property_section_data($this->get_shortcode_property_id($atts));
        if (!$property) {
            return $this->property_missing_shortcode_message();
        }

        ob_start();
        ?>
        <section class="cc-property-section-shell cc-property-overview-section">
            <div>
                <h2><?php echo esc_html($property['subtitle'] ?: $property['title'] . ' by CC Stays'); ?></h2>
                <p><?php echo $this->property_stat_label($property['guests'], 'guest'); ?> ·
                    <?php echo $this->property_stat_label($property['bedrooms'], 'bedroom'); ?> ·
                    <?php echo $this->property_stat_label($property['bathrooms'], 'bath'); ?>
                </p>
            </div>
            <div class="cc-property-residence-card">
                <?php echo $this->property_icon_svg('home'); ?>
                <div>
                    <strong>A CC Stays Residence</strong>
                    <span>Guest-first homes with hotel-level standards.</span>
                </div>
            </div>
        </section>
        <?php
        return ob_get_clean();
    }

    public function render_property_about_section($atts = [])
    {
        $property = $this->get_property_section_data($this->get_shortcode_property_id($atts));
        if (!$property) {
            return $this->property_missing_shortcode_message();
        }

        return '<section class="cc-property-section-shell cc-property-copy-section"><h2>About this stay</h2>' . $this->render_property_read_more($property['intro']) . '</section>';
    }

    public function render_property_highlights_section($atts = [])
    {
        $property = $this->get_property_section_data($this->get_shortcode_property_id($atts));
        if (!$property) {
            return $this->property_missing_shortcode_message();
        }

        ob_start();
        ?>
        <section class="cc-property-section-shell">
            <div class="cc-property-highlight-grid">
                <?php foreach ($property['highlights'] as $item): ?>
                    <article>
                        <?php echo $this->property_icon_svg($item['icon'] ?? 'sparkle'); ?>
                        <h3><?php echo esc_html($item['title'] ?? 'CC Stays'); ?></h3>
                        <p><?php echo esc_html($item['copy'] ?? ''); ?></p>
                    </article>
                <?php endforeach; ?>
            </div>
        </section>
        <?php
        return ob_get_clean();
    }

    public function render_property_sleep_section($atts = [])
    {
        $property = $this->get_property_section_data($this->get_shortcode_property_id($atts));
        if (!$property) {
            return $this->property_missing_shortcode_message();
        }

        ob_start();
        ?>
        <section class="cc-property-section-shell cc-property-sleep-section">
            <h2>Where you'll sleep</h2>
            <div class="cc-property-sleep-rail">
                <?php foreach ($property['sleeping'] as $room): ?>
                    <article>
                        <?php if (!empty($room['image'])): ?>
                            <img src="<?php echo esc_url($room['image']); ?>" alt="">
                        <?php else: ?>
                            <div class="cc-property-sleep-placeholder"><?php echo $this->property_icon_svg('bed'); ?></div>
                        <?php endif; ?>
                        <h3><?php echo esc_html($room['name'] ?? 'Bedroom'); ?></h3>
                        <p><?php echo esc_html($room['bed'] ?? 'Comfortable bed'); ?></p>
                    </article>
                <?php endforeach; ?>
            </div>
        </section>
        <?php
        return ob_get_clean();
    }

    public function render_property_amenities_section($atts = [])
    {
        $property = $this->get_property_section_data($this->get_shortcode_property_id($atts));
        if (!$property) {
            return $this->property_missing_shortcode_message();
        }

        return '<section class="cc-property-section-shell">' . $this->render_amenities_widget(['post_id' => $property['id']]) . '</section>';
    }

    public function render_property_booking_section($atts = [])
    {
        return '<section class="cc-property-section-shell cc-property-booking-section">' . $this->render_booking_widget() . '</section>';
    }

    public function render_property_reviews_section($atts = [])
    {
        $property = $this->get_property_section_data($this->get_shortcode_property_id($atts));
        if (!$property) {
            return $this->property_missing_shortcode_message();
        }

        ob_start();
        ?>
        <section class="cc-property-section-shell cc-property-reviews-section">
            <p class="cc-property-eyebrow">What guests say</p>
            <h2><?php echo $property['rating'] ? esc_html($property['rating']) . ' guest rating' : 'Guest reviews'; ?></h2>
            <?php if ($property['review_count']): ?>
                <p><?php echo esc_html($property['review_count']); ?>+ guest reviews</p><?php endif; ?>
            <div class="cc-property-review-rail">
                <?php foreach (array_slice($property['reviews'], 0, 6) as $review): ?>
                    <article>
                        <div>★★★★★</div>
                        <p>“<?php echo esc_html($review['quote'] ?? ''); ?>”</p>
                        <strong><?php echo esc_html($review['name'] ?? 'Guest'); ?></strong>
                        <span><?php echo esc_html($review['date'] ?? $property['title']); ?></span>
                    </article>
                <?php endforeach; ?>
            </div>
        </section>
        <?php
        return ob_get_clean();
    }

    public function render_property_location_section($atts = [])
    {
        $property = $this->get_property_section_data($this->get_shortcode_property_id($atts));
        if (!$property) {
            return $this->property_missing_shortcode_message();
        }

        $map_src = ($property['lat'] && $property['lng']) ? 'https://maps.google.com/maps?q=' . rawurlencode($property['lat'] . ',' . $property['lng']) . '&z=13&output=embed' : '';
        ob_start();
        ?>
        <section class="cc-property-section-shell cc-property-location-section">
            <h2>Where you'll be</h2>
            <p><?php echo esc_html($property['location_blurb']); ?></p>
            <div class="cc-property-map-box">
                <?php if ($map_src): ?>
                    <iframe title="<?php echo esc_attr($property['title']); ?> map" src="<?php echo esc_url($map_src); ?>"
                        loading="lazy"></iframe>
                <?php else: ?>
                    <span>Map location coming soon.</span>
                <?php endif; ?>
            </div>
        </section>
        <?php
        return ob_get_clean();
    }

    public function render_property_rules_section($atts = [])
    {
        $property = $this->get_property_section_data($this->get_shortcode_property_id($atts));
        if (!$property) {
            return $this->property_missing_shortcode_message();
        }

        ob_start();
        ?>
        <section class="cc-property-section-shell cc-property-rules-section">
            <h2>Things to know</h2>
            <div>
                <article>
                    <h3>House rules</h3><?php foreach ($property['rules'] as $rule): ?>
                        <p><?php echo esc_html($rule); ?></p><?php endforeach; ?>
                </article>
                <article>
                    <h3>Safety</h3><?php foreach ($property['safety'] as $item): ?>
                        <p><?php echo esc_html($item); ?></p><?php endforeach; ?>
                </article>
                <article>
                    <h3>Cancellation</h3>
                    <p><?php echo esc_html($property['cancellation']); ?></p><?php if ($property['license']): ?>
                        <p>License: <?php echo esc_html($property['license']); ?></p><?php endif; ?>
                </article>
            </div>
        </section>
        <?php
        return ob_get_clean();
    }

    public function render_property_cta_section($atts = [])
    {
        $links = $this->get_revamp_links($atts, 'cc_stays_property_cta');
        return '<section class="cc-property-final-cta"><p class="cc-property-eyebrow">Book With CC Stays</p><h2>Take the trip.<br>We’ll take care of the <em>stay.</em></h2><a href="' . esc_url($links['stays']) . '">Explore the collection →</a></section>';
    }

    private function property_cc_logo_svg($class = '')
    {
        return '<svg class="' . esc_attr($class) . '" viewBox="0 0 460.33 460.33" fill="currentColor" aria-hidden="true"><path d="M354.66,304.51c21.89-.15,42.7-7.56,56.13-21.08v-6.35c-12.63,16.1-32.99,22.89-56.14,22.89-35.22,0-64.26-34.04-65.07-69.11-.8-34.41,22.78-69.86,65.07-70.54,30.07-.49,50.51,13.23,56.14,31.57v-19.04c-13.95-12.2-34.84-17.03-56.14-17.03-55.12,0-81.78,36.97-81.6,73.97.18,37.52,27.94,75.1,81.61,74.71Z"/><path d="M187.28,283.43v-6.35c-12.63,16.1-32.99,22.89-56.14,22.89-35.22,0-64.26-34.04-65.07-69.11-.8-34.41,22.78-69.86,65.07-70.54,30.07-.49,50.51,13.23,56.14,31.57v-19.04c-13.95-12.2-34.84-17.03-56.14-17.03-55.12,0-81.78,36.97-81.6,73.97.18,37.52,27.94,75.1,81.61,74.71,21.89-.15,42.7-7.56,56.13-21.08Z"/><path d="M230.17,460.33c127.12,0,230.17-103.05,230.17-230.17S357.28,0,230.17,0,0,103.05,0,230.17s103.05,230.17,230.17,230.17ZM6.88,236.09C3.78,110.09,104.2,22.46,225.81,20.58c120.4-1.86,223.48,79.19,227.72,202.49,2.9,84.3-43.16,159.37-120.93,194.77-69.16,31.49-149.87,29.26-216.19-5.65C49.74,377.08,8.73,311,6.88,236.09Z"/><rect x="227.11" y="138.6" width="6.1" height="183.13"/></svg>';
    }

    private function get_property_flat_amenities($post_id)
    {
        $amenities_json = $this->get_property_amenities_json($post_id);
        $amenities = $amenities_json ? json_decode($amenities_json, true) : [];
        $flat = [];

        if (is_array($amenities)) {
            foreach ($amenities as $amenity) {
                if (is_string($amenity)) {
                    $flat[] = $amenity;
                } elseif (is_array($amenity)) {
                    $name = $amenity['title'] ?? $amenity['name'] ?? $amenity['amenity'] ?? '';
                    if ($name) {
                        $flat[] = $name;
                    }
                }
            }
        }

        if (empty($flat)) {
            $flat = ['Fast WiFi', 'Full kitchen', 'Fresh linens', 'Coffee maker', 'Air conditioning', 'Washer', 'Dryer', 'Outdoor space'];
        }

        return array_values(array_unique(array_filter(array_map('trim', $flat))));
    }

    private function get_property_grouped_amenities($post_id)
    {
        $amenities_json = $this->get_property_amenities_json($post_id);
        $amenities = $amenities_json ? json_decode($amenities_json, true) : [];
        $groups = [];

        if (is_array($amenities)) {
            $is_assoc = array_keys($amenities) !== range(0, count($amenities) - 1);
            if ($is_assoc) {
                foreach ($amenities as $category => $items) {
                    foreach ((array) $items as $item) {
                        $name = is_array($item) ? ($item['title'] ?? $item['name'] ?? $item['amenity'] ?? '') : $item;
                        $description = is_array($item) ? ($item['description'] ?? $item['subtitle'] ?? $item['details'] ?? '') : '';
                        if ($name) {
                            $groups[$this->title_case_label($category)][] = [
                                'name' => trim((string) $name),
                                'description' => trim((string) $description),
                            ];
                        }
                    }
                }
            } else {
                foreach ($amenities as $item) {
                    $name = is_array($item) ? ($item['title'] ?? $item['name'] ?? $item['amenity'] ?? '') : $item;
                    $description = is_array($item) ? ($item['description'] ?? $item['subtitle'] ?? $item['details'] ?? '') : '';
                    $category = is_array($item) ? ($item['category'] ?? $item['group'] ?? $item['section'] ?? '') : '';
                    if ($name) {
                        $groups[$this->title_case_label($category ?: 'Amenities')][] = [
                            'name' => trim((string) preg_replace('/^Unavailable:\s*/i', '', $name)),
                            'description' => trim((string) $description),
                        ];
                    }
                }
            }
        }

        if (empty($groups)) {
            $groups['Amenities'] = array_map(function ($amenity) {
                return ['name' => $amenity, 'description' => ''];
            }, $this->get_property_flat_amenities($post_id));
        }

        return array_filter($groups);
    }

    private function title_case_label($value)
    {
        $value = trim(preg_replace('/[\s_-]+/', ' ', (string) $value));
        return $value === '' ? 'Amenities' : ucwords(strtolower($value));
    }

    private function property_amenities_modal($groups)
    {
        $total = 0;
        foreach ($groups as $items) {
            $total += count($items);
        }

        ob_start();
        ?>
        <div class="cc-property-amenities-modal" data-amenities-modal hidden>
            <div class="cc-property-amenities-backdrop" data-amenities-close></div>
            <div class="panel" role="dialog" aria-modal="true" aria-labelledby="cc-property-amenities-title">
                <button class="modal-close" type="button" data-amenities-close aria-label="Close">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                        aria-hidden="true">
                        <path d="M5 5l14 14M19 5L5 19"></path>
                    </svg>
                </button>
                <h3 id="cc-property-amenities-title">What this stay offers</h3>
                <p class="muted"><?php echo esc_html($total); ?> amenities available.</p>
                <div class="cc-property-amenities-groups">
                    <?php foreach ($groups as $title => $items): ?>
                        <section>
                            <h4><?php echo esc_html($title); ?></h4>
                            <ul>
                                <?php foreach ($items as $item): ?>
                                    <li>
                                        <span><?php echo $this->property_icon_svg($this->property_amenity_icon_key($item['name'] ?? '')); ?></span>
                                        <div>
                                            <b><?php echo esc_html($item['name'] ?? 'Amenity'); ?></b>
                                            <?php if (!empty($item['description'])): ?>
                                                <p><?php echo esc_html($item['description']); ?></p><?php endif; ?>

                                        </div>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        </section>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
        <script>(function () { if (window.ccPropertyAmenitiesReady) return; window.ccPropertyAmenitiesReady = true; var lastTrigger = null; function modal() { return document.querySelector("[data-amenities-modal]"); } function open(trigger) { var root = modal(); if (!root) return; lastTrigger = trigger; root.hidden = false; document.documentElement.classList.add("cc-property-amenities-open"); var close = root.querySelector("[data-amenities-close]"); if (close) close.focus(); } function close() { var root = modal(); if (!root || root.hidden) return; root.hidden = true; document.documentElement.classList.remove("cc-property-amenities-open"); if (lastTrigger && lastTrigger.focus) lastTrigger.focus(); } document.addEventListener("click", function (event) { var opener = event.target.closest("[data-amenities-open]"); if (opener) { event.preventDefault(); open(opener); return; } if (event.target.closest("[data-amenities-close]")) { event.preventDefault(); close(); } }); document.addEventListener("keydown", function (event) { if (event.key === "Escape") close(); }); })();</script>
        <?php
        return ob_get_clean();
    }

    private function render_property_full_header($links)
    {
        ob_start();
        ?>
        <header class="cc-property-full-nav">
            <div class="cc-property-full-wrap cc-property-full-nav-inner">
                <a class="cc-property-full-brand" href="<?php echo esc_url($links['home']); ?>">
                    <?php echo $this->property_cc_logo_svg(); ?>
                    <span>CC Stays</span>
                </a>
                <nav aria-label="Property page navigation">
                    <a href="<?php echo esc_url($links['stays']); ?>">Stays</a>
                    <a href="<?php echo esc_url($links['about']); ?>">About Us</a>
                    <a href="<?php echo esc_url($links['contact']); ?>">Contact</a>
                    <a href="<?php echo esc_url($links['partner']); ?>">Partner With Us ↗</a>
                    <a class="muted" href="<?php echo esc_url($links['owners']); ?>">Owners ↗</a>
                </nav>
            </div>
        </header>
        <?php
        return ob_get_clean();
    }

    private function render_property_full_footer($links)
    {
        ob_start();
        ?>
        <footer class="cc-property-full-footer">
            <div class="cc-property-full-wrap cc-property-full-footer-grid">
                <div class="cc-property-full-footer-brand">
                    <?php echo $this->property_cc_logo_svg(); ?>
                    <span>STAYS</span>
                    <p>Stay somewhere you'll remember.</p>
                </div>
                <nav>
                    <h5>Stay</h5><a href="<?php echo esc_url($links['stays']); ?>">All Stays</a><a
                        href="<?php echo esc_url($links['destinations']); ?>">Destinations</a><a
                        href="<?php echo esc_url($links['experiences']); ?>">Experiences</a>
                </nav>
                <nav>
                    <h5>CC Stays</h5><a href="<?php echo esc_url($links['about']); ?>">About Us</a><a
                        href="<?php echo esc_url($links['journal']); ?>">The Journal</a><a
                        href="<?php echo esc_url($links['contact']); ?>">Contact</a>
                </nav>
                <nav>
                    <h5>Partners</h5><a href="<?php echo esc_url($links['partner']); ?>">Partner With Us ↗</a><a
                        href="<?php echo esc_url($links['owners']); ?>">Owners ↗</a>
                </nav>
                <nav>
                    <h5>Follow</h5><a href="<?php echo esc_url($links['instagram']); ?>">Instagram</a>
                </nav>
            </div>
            <div class="cc-property-full-wrap cc-property-full-footer-bottom">
                <span>© 2026 CC Stays. All rights reserved.</span>
                <span><a href="<?php echo esc_url($links['privacy']); ?>">Privacy</a><a
                        href="<?php echo esc_url($links['terms']); ?>">Terms</a><a
                        href="<?php echo esc_url($links['accessibility']); ?>">Accessibility</a></span>
            </div>
        </footer>
        <?php
        return ob_get_clean();
    }

    public function render_property_revamp_page($atts = [])
    {
        $property = $this->get_property_section_data($this->get_shortcode_property_id($atts));
        if (!$property) {
            return $this->property_missing_shortcode_message();
        }

        $links = $this->get_revamp_links($atts, 'cc_stays_property_revamp');
        $images = $property['gallery'];
        if (empty($images)) {
            $images = ['https://via.placeholder.com/1400x900?text=CC+Stays'];
        }
        $visible_images = array_slice(array_pad($images, 5, $images[0]), 0, 5);
        $amenities = $this->get_property_flat_amenities($property['id']);
        $amenity_groups = $this->get_property_grouped_amenities($property['id']);
        $rate = $property['nightly_rate'] ? '$' . esc_html(number_format((float) $property['nightly_rate'])) : '';
        $map_src = ($property['lat'] && $property['lng']) ? 'https://maps.google.com/maps?q=' . rawurlencode($property['lat'] . ',' . $property['lng']) . '&z=13&output=embed' : '';
        $concierge_url = add_query_arg('reason', 'concierge', $links['contact']);

        ob_start();
        ?>
        <div class="cc-property-composed-page cc-property-full-page">
            <?php echo $this->render_property_full_header($links); ?>
            <main>
                <div class="cc-property-full-wrap">
                    <section class="cc-property-full-hero">
                        <div>
                            <h1><?php echo esc_html($this->property_short_title($property['title'])); ?></h1>
                            <p>
                                <?php echo $this->property_location_label($property); ?>
                                <?php if ($property['rating']): ?>
                                    <span>★
                                        <?php echo esc_html($property['rating']); ?>            <?php echo $property['review_count'] ? ' · ' . esc_html($property['review_count']) . ' reviews' : ''; ?></span>
                                <?php endif; ?>
                            </p>
                        </div>
                        <a class="cc-property-share-link" href="<?php echo esc_url($property['url']); ?>">Share</a>
                    </section>

                    <section class="cc-property-full-gallery" aria-label="<?php echo esc_attr($property['title']); ?> photos">
                        <?php foreach ($visible_images as $index => $image): ?>
                            <a class="<?php echo $index === 0 ? 'primary' : ''; ?>" href="<?php echo esc_url($image); ?>"
                                target="_blank" rel="noopener">
                                <img src="<?php echo esc_url($image); ?>" alt=""
                                    loading="<?php echo $index === 0 ? 'eager' : 'lazy'; ?>">
                            </a>
                        <?php endforeach; ?>
                        <a class="cc-property-full-gallery-button" href="<?php echo esc_url($visible_images[0]); ?>"
                            target="_blank" rel="noopener">Show all photos</a>
                    </section>
                </div>

                <div class="cc-property-full-wrap cc-property-full-layout">
                    <div class="cc-property-full-main">
                        <section class="cc-property-full-section cc-property-full-overview">
                            <h2><?php echo esc_html($property['subtitle'] ?: $property['title'] . ' · ' . $this->property_location_label($property)); ?>
                            </h2>
                            <p><?php echo $this->property_stat_label($property['guests'], 'guest'); ?> ·
                                <?php echo $this->property_stat_label($property['bedrooms'], 'bedroom'); ?> ·
                                <?php echo $this->property_stat_label($property['beds'], 'bed'); ?> ·
                                <?php echo $this->property_stat_label($property['bathrooms'], 'bath'); ?></p>
                            <div class="cc-property-full-residence">
                                <?php echo $this->property_cc_logo_svg(); ?>
                                <div><strong>A CC Stays Residence</strong><span>Selected for comfort, character, and the way it
                                        feels to actually stay there.</span></div>
                            </div>
                        </section>

                        <section class="cc-property-full-section cc-property-full-about">
                            <h2>About this stay</h2>
                            <?php echo $this->render_property_read_more($property['intro']); ?>
                        </section>

                        <section class="cc-property-full-section">
                            <div class="cc-property-full-highlights">
                                <?php foreach (array_slice($property['highlights'], 0, 3) as $item): ?>
                                    <article>
                                        <span><?php echo $this->property_icon_svg($item['icon'] ?? 'sparkle'); ?></span>
                                        <div>
                                            <h3><?php echo esc_html($item['title'] ?? 'CC Stays'); ?></h3>
                                            <p><?php echo esc_html($item['copy'] ?? ''); ?></p>
                                        </div>
                                    </article>
                                <?php endforeach; ?>
                            </div>
                        </section>

                        <section class="cc-property-full-section cc-property-full-sleep">
                            <h2>Where you'll sleep</h2>
                            <div class="cc-property-full-sleep-rail">
                                <?php foreach ($property['sleeping'] as $room): ?>
                                    <article>
                                        <?php if (!empty($room['image'])): ?>
                                            <img src="<?php echo esc_url($room['image']); ?>" alt="">
                                        <?php else: ?>
                                            <div class="cc-property-full-placeholder"><?php echo $this->property_icon_svg('bed'); ?>
                                            </div>
                                        <?php endif; ?>
                                        <h3><?php echo esc_html($room['name'] ?? 'Bedroom'); ?></h3>
                                        <p><?php echo esc_html($room['bed'] ?? 'Comfortable bed'); ?></p>
                                    </article>
                                <?php endforeach; ?>
                            </div>
                        </section>

                        <section class="cc-property-full-section cc-property-full-amenities">
                            <h2>What this stay offers</h2>
                            <div>
                                <?php foreach (array_slice($amenities, 0, 10) as $amenity): ?>
                                    <p><span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                <path d="M5 12l4 4L19 6"></path>
                                            </svg></span><?php echo esc_html($amenity); ?></p>
                                <?php endforeach; ?>
                            </div>
                            <button class="cc-property-full-outline" type="button" data-amenities-open>Show all
                                <?php echo esc_html(count($amenities)); ?> amenities</button>
                            <?php echo $this->property_amenities_modal($amenity_groups); ?>
                        </section>

                        <?php if (!empty($property['reviews']) || $property['rating']): ?>
                            <section class="cc-property-full-section cc-property-full-reviews">
                                <h2><?php echo $property['rating'] ? '★ ' . esc_html($property['rating']) . ($property['review_count'] ? ' · ' . esc_html($property['review_count']) . ' reviews' : '') : 'Guest reviews'; ?>
                                </h2>
                                <div>
                                    <?php foreach (array_slice($property['reviews'], 0, 4) as $review): ?>
                                        <article><span>★★★★★</span>
                                            <p>“<?php echo esc_html($review['quote'] ?? ''); ?>”</p>
                                            <strong><?php echo esc_html($review['name'] ?? 'Guest'); ?></strong><small><?php echo esc_html($review['date'] ?? $property['title']); ?></small>
                                        </article>
                                    <?php endforeach; ?>
                                </div>
                            </section>
                        <?php endif; ?>

                        <section class="cc-property-full-section cc-property-full-promise">
                            <h2>The CC Stays Promise</h2>
                            <strong>Book with confidence.</strong>
                            <a href="<?php echo esc_url($links['contact']); ?>">Read more <span>→</span></a>
                        </section>

                        <section class="cc-property-full-section cc-property-full-location">
                            <h2>Where you'll be</h2>
                            <strong><?php echo $this->property_location_label($property); ?></strong>
                            <div class="cc-property-full-map">
                                <?php if ($map_src): ?>
                                    <iframe title="<?php echo esc_attr($property['title']); ?> map"
                                        src="<?php echo esc_url($map_src); ?>" loading="lazy"></iframe>
                                <?php else: ?>
                                    <span>Map location coming soon.</span>
                                <?php endif; ?>
                            </div>
                            <p><?php echo esc_html($property['location_blurb']); ?></p>
                        </section>

                        <section class="cc-property-full-section cc-property-full-concierge">
                            <p class="cc-property-eyebrow">24/7 Concierge</p>
                            <h2>Need something? Ask us.</h2>
                            <p>White-glove help throughout your stay.</p>
                            <a class="btn-text" href="<?php echo esc_url($concierge_url); ?>">Ask CC Stays <span>→</span></a>
                        </section>

                        <section class="cc-property-full-section cc-property-full-rules">
                            <h2>Things to know</h2>
                            <div>
                                <article>
                                    <h3>House rules</h3><?php foreach ($property['rules'] as $rule): ?>
                                        <p><?php echo esc_html($rule); ?></p><?php endforeach; ?>
                                </article>


                                <article>
                                    <h3>Safety & property</h3><?php foreach ($property['safety'] as $item): ?>
                                        <p><?php echo esc_html($item); ?></p><?php endforeach; ?>
                                </article>

                                <article>
                                    <h3>Cancellation</h3>
                                    <p><?php echo esc_html($property['cancellation']); ?></p>
                                </article>
                            </div>
                        </section>
                    </div>

                    <aside class="cc-property-full-aside">
                        <div class="cc-property-full-book-card">
                            <?php if ($rate): ?>
                                <h2><?php echo $rate; ?> <span>/ night</span></h2><?php endif; ?>
                            <?php echo $this->render_booking_widget(); ?>
                            <p>You won't be charged yet.</p>
                            <button class="cc-property-book-promise btn-text small" type="button" data-promise-open>The CC
                                Stays Promise · Book with confidence →</button>
                        </div>
                        <?php echo $this->property_promise_modal(); ?>
                    </aside>
                </div>
            </main>
            <?php echo $this->render_property_full_footer($links); ?>
        </div>
        <?php
        return ob_get_clean();
    }

    public function get_stays_archive_data()
    {
        $properties = get_posts([
            'post_type' => 'properties',
            'posts_per_page' => -1,
            'post_status' => 'publish'
        ]);

        $results = [];
        foreach ($properties as $prop) {
            $post_id = $prop->ID;
            $image_url = get_the_post_thumbnail_url($post_id, 'large');
            $gallery_images = $this->get_section_property_gallery($post_id);

            $raw_content = get_post_field('post_content', $post_id);
            $description = wp_trim_words(strip_tags($raw_content), 20, '...');

            $results[] = [
                'id' => $post_id,
                'listingId' => get_post_meta($post_id, 'guesty_listing_id', true),
                'title' => $prop->post_title,
                'url' => get_permalink($post_id),
                'image' => $image_url ? $image_url : 'https://via.placeholder.com/400x250?text=No+Image',
                'images' => $gallery_images,
                'city' => get_post_meta($post_id, 'location_city', true) ?: 'Florida',
                'guests' => (int) (get_post_meta($post_id, 'guests', true) ?: 2),
                'bedrooms' => (int) (get_post_meta($post_id, 'bedrooms', true) ?: 1),
                'bathrooms' => (int) (get_post_meta($post_id, 'bathrooms', true) ?: 1),
                'pets' => (int) get_post_meta($post_id, 'pets_allowed', true),
                'price' => get_post_meta($post_id, 'nightly_rate', true) ?: 0,
                'description' => $description ?: '',
                'lat' => floatval(get_post_meta($post_id, 'latitude', true)),
                'lng' => floatval(get_post_meta($post_id, 'longitude', true)),
            ];
        }

        return new WP_REST_Response($results, 200);
    }
}

// Initialize the plugin
new CC_Stays_Guesty_Sync();
