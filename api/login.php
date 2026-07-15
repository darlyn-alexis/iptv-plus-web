<?php
header('Content-Type: application/json');
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

$server = isset($_POST['server']) ? trim($_POST['server']) : '';
$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';

if (empty($server) || empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Por favor, completa todos los campos.']);
    exit;
}

// Clean up server URL format (remove trailing slash)
$server = rtrim($server, '/');

// Build Xtream Codes API URL
$url = $server . "/player_api.php?username=" . urlencode($username) . "&password=" . urlencode($password);

// Perform cURL request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false) {
    echo json_encode(['success' => false, 'message' => 'No se pudo conectar con el servidor IPTV: ' . $error]);
    exit;
}

if ($httpCode !== 200) {
    echo json_encode(['success' => false, 'message' => 'El servidor IPTV respondió con un código de error: ' . $httpCode]);
    exit;
}

$data = json_decode($response, true);

if (!$data || !isset($data['user_info'])) {
    echo json_encode(['success' => false, 'message' => 'Respuesta no válida del servidor IPTV. Verifica la URL.']);
    exit;
}

$userInfo = $data['user_info'];

// Validate Xtream Codes authentication status
$auth = isset($userInfo['auth']) ? (int)$userInfo['auth'] : 0;
$status = isset($userInfo['status']) ? $userInfo['status'] : '';

if ($auth === 1 && strtolower($status) === 'active') {
    // Session registration
    $_SESSION['iptv_server'] = $server;
    $_SESSION['iptv_username'] = $username;
    $_SESSION['iptv_password'] = $password;
    $_SESSION['iptv_user_info'] = $userInfo;
    $_SESSION['iptv_server_info'] = isset($data['server_info']) ? $data['server_info'] : [];

    echo json_encode([
        'success' => true,
        'message' => 'Inicio de sesión exitoso.',
        'user_info' => [
            'username' => $userInfo['username'] ?? $username,
            'exp_date' => $userInfo['exp_date'] ?? null
        ]
    ]);
} else {
    $msg = 'Usuario o contraseña incorrectos, o la cuenta no está activa.';
    if (strtolower($status) === 'expired') {
        $msg = 'Tu cuenta IPTV ha expirado.';
    } elseif (strtolower($status) === 'banned') {
        $msg = 'Tu cuenta IPTV ha sido suspendida/baneada.';
    }
    echo json_encode(['success' => false, 'message' => $msg]);
}
