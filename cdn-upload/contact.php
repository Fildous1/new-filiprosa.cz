<?php
/**
 * Contact form handler.
 * Upload this file to: cdn.filiprosa.cz/api/contact.php
 * (or configure .htaccess to route /api/contact to this file)
 *
 * Receives POST with JSON: { name, email, message, locale }
 * Sends email to the site owner.
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
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

// ── Configuration ──────────────────────────────────────────────
$recipientEmail = 'info@filiprosa.cz';  // Change to your email
$subjectPrefix  = '[filiprosa.cz]';
// ───────────────────────────────────────────────────────────────

$body = file_get_contents('php://input');
$data = json_decode($body, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$name    = trim($data['name'] ?? '');
$email   = trim($data['email'] ?? '');
$message = trim($data['message'] ?? '');
$locale  = $data['locale'] ?? 'cs';

// Validation
if (!$name || !$email || !$message) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

if (strlen($name) > 200 || strlen($email) > 200 || strlen($message) > 5000) {
    http_response_code(400);
    echo json_encode(['error' => 'Input too long']);
    exit;
}

// Simple rate limiting via temp file
$rateLimitFile = sys_get_temp_dir() . '/contact_' . md5($_SERVER['REMOTE_ADDR']) . '.txt';
if (file_exists($rateLimitFile)) {
    $lastTime = (int)file_get_contents($rateLimitFile);
    if (time() - $lastTime < 60) {
        http_response_code(429);
        echo json_encode(['error' => 'Too many requests. Please wait a minute.']);
        exit;
    }
}
file_put_contents($rateLimitFile, time());

// Build email
$subject = "$subjectPrefix New message from $name";
$emailBody = "Name: $name\nEmail: $email\nLocale: $locale\n\n$message";

$headers = [
    'From: noreply@filiprosa.cz',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: filiprosa.cz contact form',
];

$sent = mail($recipientEmail, $subject, $emailBody, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email']);
    exit;
}

echo json_encode(['success' => true]);
