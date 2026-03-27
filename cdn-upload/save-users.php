<?php
/**
 * Save users.json endpoint for the admin panel.
 * Upload this file to: cdn.filiprosa.cz/api/save-users.php
 *
 * It accepts POST requests with JSON body containing the users manifest,
 * validates the auth token, and writes to ../users.json
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Validate auth token (same as other API endpoints)
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

// Read the expected token from .env or config
// Adjust this path to match your CDN server's auth mechanism
$configFile = __DIR__ . '/../.env';
$expectedToken = '';
if (file_exists($configFile)) {
    $lines = file($configFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, 'API_TOKEN=') === 0) {
            $expectedToken = substr($line, 10);
            break;
        }
        if (strpos($line, 'ADMIN_PASSWORD=') === 0) {
            $expectedToken = substr($line, 15);
            break;
        }
    }
}

if (!$token || ($expectedToken && $token !== $expectedToken)) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Read and validate JSON body
$body = file_get_contents('php://input');
$data = json_decode($body, true);

if (!$data || !isset($data['users']) || !is_array($data['users'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid data: must contain "users" array']);
    exit;
}

// Write to users.json in CDN root
$usersFile = __DIR__ . '/../users.json';
$result = file_put_contents($usersFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to write users.json']);
    exit;
}

echo json_encode(['success' => true]);
