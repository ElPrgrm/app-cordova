document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registerForm');
    const alertBox = document.getElementById('registerAlert');

    // Use external API server
    const API_URL = 'https://elrjtd.online/DDI/API/usuarios.php';

    function showAlert(message, type = 'danger') {
        alertBox.className = `alert alert-${type}`;
        alertBox.textContent = message;
        alertBox.classList.remove('d-none');
    }

    function hideAlert() {
        alertBox.classList.add('d-none');
        alertBox.textContent = '';
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        hideAlert();

        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value.trim();
        const confirm = document.getElementById('regConfirm').value.trim();

        if (!username || !password) {
            showAlert('Por favor completa usuario y contraseña.');
            return;
        }

        if (password !== confirm) {
            showAlert('Las contraseñas no coinciden.');
            return;
        }

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', username, password })
        })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(result => {
            if (result.status === 200 && result.body.success) {
                showAlert(result.body.message || 'Usuario registrado.', 'success');
                setTimeout(() => { window.location.href = 'login.html'; }, 1200);
            } else {
                showAlert(result.body.error || 'No se pudo registrar el usuario.');
            }
        })
        .catch(() => {
            showAlert('No se pudo conectar con el servidor.');
        });
    });
});
