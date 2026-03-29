<?php
/**
 * CDN API Configuration
 *
 * IMPORTANT: Change the ADMIN_TOKEN before deploying!
 * This token must match what the admin panel sends in the Authorization header.
 */

// Admin authentication token — change this to a secure random string
define('ADMIN_TOKEN', 'darkroom2026');

// Base directory for CDN content (one level up from /api/)
define('CDN_ROOT', dirname(__DIR__) . '/');

// Allowed file types for upload
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg', 'pdf']);

// Maximum upload size (20 MB)
define('MAX_UPLOAD_SIZE', 20 * 1024 * 1024);

// Allowed manifest types
define('ALLOWED_MANIFEST_TYPES', ['gallery', 'museum', 'rosnik', 'gear']);

/**
 * Verify the Authorization header against the admin token.
 * Sends 401 and exits if invalid.
 */
function requireAuth(): void {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (!preg_match('/^Bearer\s+(.+)$/i', $auth, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Missing or invalid Authorization header']);
        exit;
    }

    if (!hash_equals(ADMIN_TOKEN, $matches[1])) {
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
    header('Access-Control-Allow-Headers: Authorization, Content-Type');

    // Handle preflight
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
 * Returns the sanitized path or false if invalid.
 */
function sanitizePath(string $path): string|false {
    // Remove leading slashes
    $path = ltrim($path, '/');

    // Resolve and check for directory traversal
    $resolved = realpath(CDN_ROOT . dirname($path));
    if ($resolved === false) {
        // Directory doesn't exist yet — check the path doesn't contain traversal
        if (preg_match('/\.\./', $path)) {
            return false;
        }
        return $path;
    }

    // Ensure resolved path is within CDN_ROOT
    $cdnRoot = realpath(CDN_ROOT);
    if (strpos($resolved, $cdnRoot) !== 0) {
        return false;
    }

    return $path;
}
