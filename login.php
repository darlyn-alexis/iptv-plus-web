<?php
session_start();

// If already logged in, redirect to dashboard
if (isset($_SESSION['iptv_username']) && isset($_SESSION['iptv_password']) && isset($_SESSION['iptv_server'])) {
    header("Location: dashboard.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar Sesión - TVMóvil</title>
    <meta name="description" content="Accede a tu cuenta de IPTV para disfrutar de canales en vivo, series y películas en TVMóvil.">
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- FontAwesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- CSS -->
    <link rel="stylesheet" href="assets/css/auth.css">
</head>
<body>
    <div class="background-overlay"></div>
    
    <main class="auth-container">
        <header class="auth-header">
            <div class="logo">
                <i class="fa-solid fa-circle-play logo-icon"></i>
                <span class="logo-text">TV<span>Móvil</span></span>
            </div>
            <h1>Bienvenido</h1>
            <p>Ingresa tus credenciales Xtream Codes de tu IPTV para comenzar</p>
        </header>

        <form id="loginForm" class="auth-form" novalidate>
            <!-- Error message container -->
            <div id="errorMessage" class="error-container hidden">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span class="error-text"></span>
            </div>

            <!-- Server URL Input -->
            <div class="input-group">
                <label for="server">Servidor IPTV</label>
                <div class="input-wrapper">
                    <i class="fa-solid fa-server input-icon"></i>
                    <input type="url" id="server" name="server" required placeholder="http://servidor.com:8080" autocomplete="off">
                </div>
            </div>

            <!-- Username Input -->
            <div class="input-group">
                <label for="username">Usuario</label>
                <div class="input-wrapper">
                    <i class="fa-solid fa-user input-icon"></i>
                    <input type="text" id="username" name="username" required placeholder="Tu usuario" autocomplete="off">
                </div>
            </div>

            <!-- Password Input -->
            <div class="input-group">
                <label for="password">Contraseña</label>
                <div class="input-wrapper">
                    <i class="fa-solid fa-lock input-icon"></i>
                    <input type="password" id="password" name="password" required placeholder="••••••••" autocomplete="off">
                    <button type="button" id="togglePassword" class="password-toggle-btn" aria-label="Mostrar contraseña">
                        <i class="fa-regular fa-eye"></i>
                    </button>
                </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" id="submitBtn" class="submit-btn">
                <span class="btn-text">Ingresar</span>
                <span class="btn-loader hidden">
                    <i class="fa-solid fa-circle-notch fa-spin"></i> Conectando...
                </span>
            </button>
        </form>
    </main>

    <!-- JS -->
    <script src="assets/js/auth.js"></script>
</body>
</html>
