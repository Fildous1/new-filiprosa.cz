<?php
/**
 * CDN API Configuration
 */

// Admin authentication token
define('ADMIN_TOKEN', 'DvCQPJ8xXnPmu4S');

// Base directory for CDN content (one level up from /api/)
define('CDN_ROOT', dirname(__DIR__) . '/');

// Allowed file types for upload
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg', 'pdf']);

// Maximum upload size (50 MB)
define('MAX_UPLOAD_SIZE', 50 * 1024 * 1024);

// Allowed manifest types
define('ALLOWED_MANIFEST_TYPES', ['gallery', 'museum', 'rosnik', 'gear', 'services', 'site']);

/**
 * Verify the Authorization header against the admin token.
 * Sends 401 and exits if invalid.
 */
function requireAuth(): void {
    $headers = getallheaders();
    $token = '';

    $candidates = [
        $headers['Authorization'] ?? '',
        $headers['authorization'] ?? '',
        $_SERVER['HTTP_AUTHORIZATION'] ?? '',
        $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '',
    ];

    foreach ($candidates as $candidate) {
        if ($candidate && preg_match('/^Bearer\s+(.+)$/i', $candidate, $m)) {
            $token = $m[1];
            break;
        }
    }

    if (!$token) {
        $token = $headers['X-Api-Key']
              ?? $headers['x-api-key']
              ?? $_SERVER['HTTP_X_API_KEY']
              ?? '';
    }

    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Missing or invalid Authorization header']);
        exit;
    }

    if (!hash_equals(ADMIN_TOKEN, $token)) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid token']);
        exit;
    }
}

/**
 * Set JSON response headers and CORS for API responses.
 */
function apiHeaders(): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Api-Key');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * Ensure the request method is POST.
 */
function requirePost(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }
}

/**
 * Sanitize a file path to prevent directory traversal.
 */
function sanitizePath(string $path): string|false {
    $path = ltrim($path, '/');

    $resolved = realpath(CDN_ROOT . dirname($path));
    if ($resolved === false) {
        if (preg_match('/\.\./', $path)) {
            return false;
        }
        return $path;
    }

    $cdnRoot = realpath(CDN_ROOT);
    if (strpos($resolved, $cdnRoot) !== 0) {
        return false;
    }

    return $path;
}
