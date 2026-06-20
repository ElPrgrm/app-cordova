document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const loginAlert = document.getElementById('loginAlert');
    

    const API_URL = 'https://elrjtd.online/DDI/API/usuarios.php';


    function showAlert(message, type = 'danger') {
        loginAlert.className = `alert alert-${type}`;
        loginAlert.textContent = message;
        loginAlert.classList.remove('d-none');
    }

    function hideAlert() {
        loginAlert.classList.add('d-none');
        loginAlert.textContent = '';
    }

    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        hideAlert();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            showAlert('Por favor ingresa usuario y contraseña.');
            return;
        }

        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(result => {
            if (result.status === 200 && result.body.success) {
                localStorage.setItem('loggedUser', JSON.stringify(result.body.user));
                localStorage.setItem('authToken', result.body.token);
                if (result.body.user && result.body.user.uuid) {
                    localStorage.setItem('UUID', result.body.user.uuid);
                }
                window.location.href = 'index.html';
            } else {
                showAlert(result.body.error || 'Usuario o contraseña incorrectos.');
            }
        })
        .catch(() => {
            showAlert('No se pudo conectar con el servidor.');
        });
    });
});
