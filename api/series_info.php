<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['iptv_username']) || !isset($_SESSION['iptv_password']) || !isset($_SESSION['iptv_server'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

$seriesId = isset($_GET['series_id']) ? intval($_GET['series_id']) : 0;
if ($seriesId <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID de serie inválido']);
    exit;
}

$server = rtrim($_SESSION['iptv_server'], '/');
$username = $_SESSION['iptv_username'];
$password = $_SESSION['iptv_password'];

$cacheDir = __DIR__ . '/../cache';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0777, true);
}

$cacheFile = $cacheDir . "/series_info_{$seriesId}.json";
$cacheLife = 12 * 3600; // 12 hours

$data = null;
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheLife)) {
    $json = file_get_contents($cacheFile);
    $data = json_decode($json, true);
} else {
    $url = $server . "/player_api.php?username=" . urlencode($username) . "&password=" . urlencode($password) . "&action=" . $apiAction = 'get_series_info' . "&series_id=" . $seriesId;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response !== false && $httpCode === 200) {
        $data = json_decode($response, true);
        if (is_array($data)) {
            file_put_contents($cacheFile, $response);
        }
    }
}

if (!is_array($data)) {
    echo json_encode(['success' => false, 'message' => 'No se pudo obtener la información de la serie desde IPTV']);
    exit;
}

echo json_encode([
    'success' => true,
    'seasons' => isset($data['seasons']) ? $data['seasons'] : [],
    'episodes' => isset($data['episodes']) ? $data['episodes'] : [],
    'info' => isset($data['info']) ? $data['info'] : []
]);
