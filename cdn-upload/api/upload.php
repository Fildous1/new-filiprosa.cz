<?php
/**
 * CDN Upload API
 *
 * POST /api/upload
 * Body: FormData { files: File[], path: string }
 * Headers: Authorization: Bearer <token>
 *
 * Uploads one or more files to the specified CDN path.
 */

// Increase PHP limits for large/bulk uploads
@ini_set('upload_max_filesize', '50M');
@ini_set('post_max_size', '200M');
@ini_set('max_file_uploads', '50');
@ini_set('max_execution_time', '300');
@ini_set('max_input_time', '300');
@ini_set('memory_limit', '256M');

require_once __DIR__ . '/config.php';

apiHeaders();
requirePost();
requireAuth();

// Validate destination path
$destinationPath = $_POST['path'] ?? '';
if (empty($destinationPath)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing "path" parameter']);
    exit;
}

$safePath = sanitizePath($destinationPath);
if ($safePath === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid path']);
    exit;
}

// Check for uploaded files
if (!isset($_FILES['files'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No files uploaded']);
    exit;
}

$files = $_FILES['files'];
$uploadedUrls = [];
$errors = [];

// Normalize single file upload to array format
if (!is_array($files['name'])) {
    $files = [
        'name'     => [$files['name']],
        'tmp_name' => [$files['tmp_name']],
        'error'    => [$files['error']],
        'size'     => [$files['size']],
        'type'     => [$files['type']],
    ];
}

$fileCount = count($files['name']);

for ($i = 0; $i < $fileCount; $i++) {
    $name    = $files['name'][$i];
    $tmpName = $files['tmp_name'][$i];
    $error   = $files['error'][$i];
    $size    = $files['size'][$i];

    // Check upload error
    if ($error !== UPLOAD_ERR_OK) {
        $errors[] = "Upload error for $name: code $error";
        continue;
    }

    // Check file size
    if ($size > MAX_UPLOAD_SIZE) {
        $errors[] = "$name exceeds maximum upload size";
        continue;
    }

    // Validate extension
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_EXTENSIONS)) {
        $errors[] = "$name: file type .$ext not allowed";
        continue;
    }

    // Sanitize filename
    $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $name);

    // Create destination directory if needed
    $destDir = CDN_ROOT . rtrim($safePath, '/');
    if (!is_dir($destDir)) {
        if (!mkdir($destDir, 0755, true)) {
            $errors[] = "Failed to create directory for $name";
            continue;
        }
    }

    // Move uploaded file
    $destFile = $destDir . '/' . $safeName;
    if (move_uploaded_file($tmpName, $destFile)) {
        $relativePath = $safePath . '/' . $safeName;
        $uploadedUrls[] = 'https://cdn.filiprosa.cz/' . ltrim($relativePath, '/');
    } else {
        $errors[] = "Failed to save $name";
    }
}

$response = [
    'success' => count($errors) === 0,
    'urls'    => $uploadedUrls,
];

if (!empty($errors)) {
    $response['errors'] = $errors;
}

echo json_encode($response);
