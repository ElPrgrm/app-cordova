document.addEventListener('DOMContentLoaded', function () {
    const currentPage = window.location.pathname.split('/').pop();
    const isLoginPage = currentPage === 'login.html';

    const loggedUser = localStorage.getItem('loggedUser');
    const authToken = localStorage.getItem('authToken');
    const isAuthenticated = Boolean(loggedUser && authToken);

    if (!isAuthenticated && !isLoginPage) {
        window.location.href = 'login.html';
        return;
    }

    if (isAuthenticated && isLoginPage) {
        window.location.href = 'index.html';
        return;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.style.display = 'inline-flex';
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('loggedUser');
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        });
    }
});
