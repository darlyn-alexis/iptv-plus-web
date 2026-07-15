<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['iptv_username']) || !isset($_SESSION['iptv_password']) || !isset($_SESSION['iptv_server'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

$server = $_SESSION['iptv_server'];
$username = $_SESSION['iptv_username'];
$password = $_SESSION['iptv_password'];
$categoryId = isset($_GET['category_id']) ? trim($_GET['category_id']) : '';

// Retrieve channels
$url = $server . "/player_api.php?username=" . urlencode($username) . "&password=" . urlencode($password) . "&action=get_live_streams";

// In Xtream Codes, you can also filter directly in some API versions, but filtering in PHP is 100% reliable across all servers
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 25); // Can be large
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    echo json_encode(['success' => false, 'message' => 'Error al conectar con el servidor IPTV']);
    exit;
}

$channels = json_decode($response, true);

if (!is_array($channels)) {
    echo json_encode(['success' => false, 'message' => 'Respuesta no válida del servidor IPTV']);
    exit;
}

// Filter by category_id if provided
if ($categoryId !== '') {
    $filteredChannels = array_values(array_filter($channels, function($channel) use ($categoryId) {
        return isset($channel['category_id']) && (string)$channel['category_id'] === $categoryId;
    }));
    echo json_encode($filteredChannels);
} else {
    // Return all channels
    echo json_encode($channels);
}
