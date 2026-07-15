document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const serverInput = document.getElementById('server');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = errorMessage.querySelector('.error-text');

    // Toggle Password Visibility
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Change icon
        const icon = togglePasswordBtn.querySelector('i');
        if (type === 'text') {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    // Form Submit Handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Hide previous errors
        errorMessage.classList.add('hidden');
        
        // Fetch values
        const server = serverInput.value.trim();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Basic validations
        if (!server || !username || !password) {
            showError('Por favor, completa todos los campos.');
            return;
        }

        // Validate server URL format
        try {
            new URL(server);
        } catch (_) {
            showError('Ingresa una dirección de servidor IPTV válida (ej. http://ejemplo.com:8080).');
            return;
        }

        // Set Loading state
        setLoading(true);

        try {
            // Build Form Data
            const formData = new FormData();
            formData.append('server', server);
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch('api/login.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Error de red: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Success! Redirect to dashboard (connection screen)
                window.location.href = 'dashboard.php';
            } else {
                showError(data.message || 'Error al iniciar sesión.');
            }
        } catch (error) {
            showError('No se pudo conectar con el servidor. Revisa tu conexión a internet o la URL del servidor.');
            console.error('Error durante el login:', error);
        } finally {
            setLoading(false);
        }
    });

    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        
        // Re-trigger shake animation
        errorMessage.style.animation = 'none';
        errorMessage.offsetHeight; /* trigger reflow */
        errorMessage.style.animation = null;
    }

    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
        } else {
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    }
});
