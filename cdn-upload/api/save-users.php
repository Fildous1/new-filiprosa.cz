<?php
/**
 * Save Users API
 *
 * POST /api/save-users
 * Body: JSON { users: [...], updatedAt?: number }
 * Headers: Authorization: Bearer <token>
 *
 * Saves the users manifest to CDN root as users.json.
 */

require_once __DIR__ . '/config.php';

apiHeaders();
requirePost();
requireAuth();

// Read and validate JSON body
$body = file_get_contents('php://input');
$data = json_decode($body, true);

if (!$data || !isset($data['users']) || !is_array($data['users'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid data: must contain "users" array']);
    exit;
}

// Write to users.json in CDN root
$usersFile = CDN_ROOT . 'users.json';
$result = file_put_contents($usersFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to write users.json']);
    exit;
}

echo json_encode(['success' => true]);
