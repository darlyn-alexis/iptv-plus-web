<?php
session_start();

// If not logged in, redirect to login page
if (!isset($_SESSION['iptv_username']) || !isset($_SESSION['iptv_password']) || !isset($_SESSION['iptv_server'])) {
    header("Location: login.php");
    exit;
}

// Log out action
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_destroy();
    header("Location: login.php");
    exit;
}

$userInfo = $_SESSION['iptv_user_info'] ?? [];
$username = $_SESSION['iptv_username'];
$server = $_SESSION['iptv_server'];
$expDate = isset($userInfo['exp_date']) && is_numeric($userInfo['exp_date']) 
    ? date('d/m/Y H:i', (int)$userInfo['exp_date']) 
    : 'No expira';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - TVMóvil</title>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            background-color: #0c0f17;
            color: #ffffff;
            margin: 0;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            box-sizing: border-box;
        }
        .container {
            background: rgba(20, 24, 38, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(16px);
            border-radius: 20px;
            padding: 3rem;
            text-align: center;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        h1 {
            margin-top: 0;
            color: #ff3b30;
        }
        p {
            color: #8a8f9d;
            line-height: 1.6;
        }
        .info-box {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
            padding: 1.5rem;
            margin: 2rem 0;
            text-align: left;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .info-item {
            margin-bottom: 0.8rem;
            font-size: 0.95rem;
        }
        .info-item:last-child {
            margin-bottom: 0;
        }
        .info-label {
            color: #8a8f9d;
            font-weight: 500;
            display: inline-block;
            width: 100px;
        }
        .logout-btn {
            background: #ff3b30;
            color: white;
            border: none;
            padding: 0.8rem 2rem;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.2s ease;
            margin: 0.5rem;
        }
        .logout-btn:hover {
            background: #e02b20;
            transform: translateY(-2px);
        }
        .enter-btn {
            background: #34c759;
            color: white;
            border: none;
            padding: 0.8rem 2rem;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.2s ease;
            margin: 0.5rem;
        }
        .enter-btn:hover {
            background: #28a745;
            transform: translateY(-2px);
        }
        .buttons-container {
            display: flex;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <i class="fa-solid fa-circle-check" style="font-size: 3rem; color: #34c759; margin-bottom: 1rem;"></i>
        <h1>Conexión Exitosa</h1>
        <p>¡Te has conectado correctamente a tu proveedor IPTV!</p>
        
        <div class="info-box">
            <div class="info-item">
                <span class="info-label">Servidor:</span> 
                <span><?php echo htmlspecialchars($server); ?></span>
            </div>
            <div class="info-item">
                <span class="info-label">Usuario:</span> 
                <span><?php echo htmlspecialchars($username); ?></span>
            </div>
            <div class="info-item">
                <span class="info-label">Expiración:</span> 
                <span><?php echo htmlspecialchars($expDate); ?></span>
            </div>
        </div>

        <div class="buttons-container">
            <a href="index.php" class="enter-btn">
                <i class="fa-solid fa-circle-play"></i> Ingresar a plataforma
            </a>
            <a href="dashboard.php?action=logout" class="logout-btn">
                <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
            </a>
        </div>
    </div>
</body>
</html>
