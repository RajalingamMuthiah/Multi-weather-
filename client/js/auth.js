const API_URL = 'http://localhost:5000/api';

const tabs = document.querySelectorAll('.tab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.getAttribute('data-tab');
    
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    if (tabName === 'login') {
      loginForm.classList.add('active');
      registerForm.classList.remove('active');
    } else {
      registerForm.classList.add('active');
      loginForm.classList.remove('active');
    }
  });
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      errorDiv.textContent = data.message || 'Login failed';
      return;
    }
    
    localStorage.setItem('token', data.token);
    window.location.href = 'dashboard.html';
  } catch (error) {
    errorDiv.textContent = 'Network error. Please try again.';
    console.error('Login error:', error);
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const errorDiv = document.getElementById('registerError');
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      errorDiv.textContent = data.message || 'Registration failed';
      return;
    }
    
    localStorage.setItem('token', data.token);
    window.location.href = 'dashboard.html';
  } catch (error) {
    errorDiv.textContent = 'Network error. Please try again.';
    console.error('Register error:', error);
  }
});
