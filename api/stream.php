<?php
session_start();

if (!isset($_SESSION['iptv_username']) || !isset($_SESSION['iptv_password']) || !isset($_SESSION['iptv_server'])) {
    http_response_code(401);
    exit('Unauthorized');
}

if (!isset($_GET['stream_id'])) {
    http_response_code(400);
    exit('Stream ID is required');
}

$stream_id = $_GET['stream_id'];
$type = isset($_GET['type']) ? $_GET['type'] : 'live';
$extension = isset($_GET['extension']) ? $_GET['extension'] : '';

$server = rtrim($_SESSION['iptv_server'], '/');
$username = urlencode($_SESSION['iptv_username']);
$password = urlencode($_SESSION['iptv_password']);
$stream_id = urlencode($stream_id);

// Construct correct URL based on stream type
if ($type === 'movie') {
    $url = "{$server}/movie/{$username}/{$password}/{$stream_id}";
    if ($extension !== '') {
        $url .= "." . urlencode($extension);
    }
} else if ($type === 'series') {
    $url = "{$server}/series/{$username}/{$password}/{$stream_id}";
    if ($extension !== '') {
        $url .= "." . urlencode($extension);
    }
} else {
    $ext = ($extension !== '') ? $extension : 'ts';
    $url = "{$server}/live/{$username}/{$password}/{$stream_id}.{$ext}";
}

// Check for range request headers sent by browser
$requestHeaders = [];
if (isset($_SERVER['HTTP_RANGE'])) {
    $requestHeaders[] = 'Range: ' . $_SERVER['HTTP_RANGE'];
}
if (isset($_SERVER['HTTP_IF_RANGE'])) {
    $requestHeaders[] = 'If-Range: ' . $_SERVER['HTTP_IF_RANGE'];
}

// Set dynamic Content-Type based on extension
$contentType = 'video/mp2t'; // Default (usually for live streams)
if ($extension !== '') {
    switch (strtolower($extension)) {
        case 'mp4':
            $contentType = 'video/mp4';
            break;
        case 'mkv':
            $contentType = 'video/x-matroska';
            break;
        case 'webm':
            $contentType = 'video/webm';
            break;
        case 'avi':
            $contentType = 'video/x-msvideo';
            break;
    }
}

// Set default headers for CORS and fallback Content-Type
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Content-Type: ' . $contentType);
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// End execution early for OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Close session to prevent session locking while streaming
session_write_close();

// LOG REQUEST FOR DEBUGGING
file_put_contents(__DIR__ . '/../cache/debug.log', "[" . date('Y-m-d H:i:s') . "] REQUEST: " . $url . "\n", FILE_APPEND);

$ch = curl_init($url);

// Forward browser headers to IPTV server
if (!empty($requestHeaders)) {
    curl_setopt($ch, CURLOPT_HTTPHEADER, $requestHeaders);
}

// Output directly to the browser
curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_BUFFERSIZE, 128000); // 128KB buffer for smooth streaming

// Useful for generic IPTV providers using invalid SSL
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

// Timeout settings
set_time_limit(0);
curl_setopt($ch, CURLOPT_TIMEOUT, 0);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

$isRedirect = false;

// Capture IPTV server response headers and forward them to browser
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($ch, $headerLine) use (&$isRedirect) {
    $len = strlen($headerLine);
    $header = trim($headerLine);
    
    // LOG HEADER FOR DEBUGGING
    file_put_contents(__DIR__ . '/../cache/debug.log', "IPTV Header: " . $headerLine, FILE_APPEND);
    
    // Check if this line is an HTTP status line
    if (preg_match('/^HTTP\/\d\.\d\s+(\d+)/i', $header, $matches)) {
        $code = intval($matches[1]);
        if ($code >= 300 && $code < 400) {
            $isRedirect = true;
        } else {
            $isRedirect = false;
            if ($code === 200 || $code === 206 || $code === 416) {
                http_response_code($code);
            }
        }
        return $len;
    }
    
    // If it's a redirect response (like 302 Found), do not forward any headers to the browser
    if ($isRedirect) {
        return $len;
    }
    
    $parts = explode(':', $header, 2);
    
    if (count($parts) === 2) {
        $name = strtolower(trim($parts[0]));
        // Forward key content delivery headers
        if ($name === 'content-range' || $name === 'accept-ranges' || $name === 'content-length' || $name === 'content-type') {
            header($headerLine, true);
        }
    }
    return $len;
});

curl_exec($ch);

if (curl_errno($ch)) {
    $err = curl_error($ch);
    file_put_contents(__DIR__ . '/../cache/debug.log', "cURL Error: " . $err . "\n", FILE_APPEND);
    error_log('cURL Error streaming video: ' . $err);
}

curl_close($ch);
?>
