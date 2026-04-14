<?php
/**
 * Debug endpoint — dumps headers and server state.
 * Requires auth. Only accessible from admin panel.
 *
 * POST /api/debug
 */

require_once __DIR__ . '/config.php';

apiHeaders();
requireAuth();
requirePost();

$allHeaders = getallheaders();

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

// Scan CDN root directories
$dirs = [];
$cdnRoot = CDN_ROOT;
if (is_dir($cdnRoot)) {
    foreach (scandir($cdnRoot) as $entry) {
        if ($entry === '.' || $entry === '..') continue;
        $fullPath = $cdnRoot . $entry;
        if (is_dir($fullPath)) {
            $fileCount = count(array_filter(scandir($fullPath), fn($f) => $f !== '.' && $f !== '..'));
            $dirs[$entry] = $fileCount . ' entries';
        } else {
            $dirs[$entry] = round(filesize($fullPath) / 1024, 1) . ' KB';
        }
    }
}

echo json_encode([
    'auth'        => 'ok',
    'php_version' => PHP_VERSION,
    'php_sapi'    => php_sapi_name(),
    'cdn_root'    => $cdnRoot,
    'cdn_contents'=> $dirs,
    'headers'     => $allHeaders,
    'server_vars' => $serverVars,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
