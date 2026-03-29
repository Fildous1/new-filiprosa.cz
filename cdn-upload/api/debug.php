<?php
/**
 * Debug endpoint — dumps everything PHP receives.
 * DELETE THIS FILE after debugging!
 *
 * GET or POST /api/debug
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Api-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$allHeaders = getallheaders();

// Filter $_SERVER to just HTTP_* and relevant keys
$serverVars = [];
foreach ($_SERVER as $key => $value) {
    if (
        strpos($key, 'HTTP_') === 0 ||
        strpos($key, 'REDIRECT_') === 0 ||
        in_array($key, ['REQUEST_METHOD', 'REQUEST_URI', 'SCRIPT_FILENAME', 'SERVER_SOFTWARE', 'GATEWAY_INTERFACE', 'PHP_SELF'])
    ) {
        $serverVars[$key] = $value;
    }
}

echo json_encode([
    'getallheaders' => $allHeaders,
    'server_vars' => $serverVars,
    'php_sapi' => php_sapi_name(),
    'php_version' => PHP_VERSION,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
