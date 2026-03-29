<?php
/**
 * CDN Manifest API
 *
 * POST /api/manifest
 * Body: JSON { type: 'gallery'|'museum'|'rosnik', data: object }
 * Headers: Authorization: Bearer <token>
 *
 * Saves a manifest JSON file to the CDN root.
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

$type = $input['type'] ?? '';
$data = $input['data'] ?? null;

// Validate type
if (!in_array($type, ALLOWED_MANIFEST_TYPES)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid manifest type. Allowed: ' . implode(', ', ALLOWED_MANIFEST_TYPES)]);
    exit;
}

// Validate data
if ($data === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing "data" field']);
    exit;
}

// Write manifest file
$manifestPath = CDN_ROOT . $type . '.json';
$jsonContent = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

if ($jsonContent === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to encode JSON']);
    exit;
}

if (file_put_contents($manifestPath, $jsonContent) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to write manifest file']);
    exit;
}

echo json_encode([
    'success' => true,
    'path'    => $type . '.json',
]);
