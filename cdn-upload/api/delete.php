<?php
/**
 * CDN Delete API
 *
 * POST /api/delete
 * Body: JSON { path: string }
 * Headers: Authorization: Bearer <token>
 *
 * Deletes a file from the CDN.
 */

require_once __DIR__ . '/config.php';

apiHeaders();
requirePost();
requireAuth();

// Parse JSON body
$input = json_decode(file_get_contents('php://input'), true);
if ($input === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON body']);
    exit;
}

$path = $input['path'] ?? '';
if (empty($path)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing "path" parameter']);
    exit;
}

// Sanitize path
$safePath = sanitizePath($path);
if ($safePath === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid path']);
    exit;
}

$fullPath = CDN_ROOT . $safePath;

// Check file exists
if (!file_exists($fullPath)) {
    http_response_code(404);
    echo json_encode(['error' => 'File not found']);
    exit;
}

// Prevent deleting directories, API files, or .htaccess
if (is_dir($fullPath)) {
    http_response_code(400);
    echo json_encode(['error' => 'Cannot delete directories']);
    exit;
}

$basename = basename($fullPath);
if (str_ends_with($basename, '.php') || str_starts_with($basename, '.')) {
    http_response_code(403);
    echo json_encode(['error' => 'Cannot delete system files']);
    exit;
}

// Delete the file
if (unlink($fullPath)) {
    echo json_encode([
        'success' => true,
        'deleted' => $safePath,
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to delete file']);
}
