document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect
    if (localStorage.getItem('token')) {
        window.location.href = '/chat.html';
    }

    let isLogin = true;

    const form = document.getElementById('auth-form');
    const toggleAuthBtn = document.getElementById('toggle-auth');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const authBtn = document.getElementById('auth-btn');
    const errorMsg = document.getElementById('error-msg');

    toggleAuthBtn.addEventListener('click', () => {
        isLogin = !isLogin;
        if (isLogin) {
            authTitle.innerText = "Welcome Back";
            authSubtitle.innerText = "Login to continue to your chats.";
            authBtn.innerText = "Login";
            toggleAuthBtn.innerText = "Don't have an account? Register here.";
        } else {
            authTitle.innerText = "Create Account";
            authSubtitle.innerText = "Register to start messaging.";
            authBtn.innerText = "Register";
            toggleAuthBtn.innerText = "Already have an account? Login here.";
        }
        errorMsg.innerText = "";
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.innerText = "";

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            errorMsg.innerText = "Please fill in all fields.";
            return;
        }

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                errorMsg.innerText = data.msg || 'Authentication failed.';
                return;
            }

            // Success! Store token securely
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            
            // Redirect to the chat interface
            window.location.href = '/chat.html';

        } catch (err) {
            console.error('Auth error:', err);
            errorMsg.innerText = "Something went wrong. Try again later.";
        }
    });
});
