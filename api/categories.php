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

$url = $server . "/player_api.php?username=" . urlencode($username) . "&password=" . urlencode($password) . "&action=get_live_categories";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    echo json_encode(['success' => false, 'message' => 'Error al conectar con el servidor IPTV']);
    exit;
}

// Return the exact JSON response from the server
echo $response;
