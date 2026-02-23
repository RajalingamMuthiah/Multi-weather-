const API_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const fetchUserProfile = async () => {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    displayUserGreeting(user.name);
    return user;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
};

const displayUserGreeting = (userName) => {
  const greetingElement = document.querySelector('.user-greeting');
  if (greetingElement) {
    greetingElement.textContent = `Welcome, ${userName}!`;
  }
};

const fetchCities = async () => {
  const token = getToken();
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  try {
    showLoading();
    const response = await fetch(`${API_URL}/cities`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
        return;
      }
      throw new Error('Failed to fetch cities');
    }

    const data = await response.json();
    renderFavorites(data.favorites);
    renderCities(data.cities);
  } catch (error) {
    showError('Failed to load cities. Please try again.');
    console.error(error);
  }
};

const renderFavorites = (favorites) => {
  const favoritesContainer = document.getElementById('favoritesContainer');
  if (!favoritesContainer) return;

  if (favorites.length === 0) {
    favoritesContainer.innerHTML = '<span class="no-favorites">No favorites yet</span>';
    return;
  }

  favoritesContainer.innerHTML = favorites
    .map(
      (city) => `
    <div class="favorite-badge">
      <span class="favorite-city-name">${city.cityName}</span>
      <span class="favorite-temp">${city.currentWeather.temperature !== null ? city.currentWeather.temperature + '°C' : 'N/A'}</span>
    </div>
  `
    )
    .join('');
};

const renderCities = (cities) => {
  const container = document.getElementById('citiesContainer');

  if (cities.length === 0) {
    container.innerHTML = '<p class="empty-message">No cities added yet. Add your first city!</p>';
    return;
  }

  container.innerHTML = cities
    .map(
      (city) => `
    <div class="city-card ${city.isFavorite ? 'is-favorite' : ''}">
      <div class="city-header">
        <h3>${city.cityName}</h3>
        ${city.isFavorite ? '<span class="favorite-star">★</span>' : ''}
      </div>
      <div class="current-weather-section">
        <p class="temperature">${city.currentWeather.temperature !== null ? city.currentWeather.temperature + '°C' : 'N/A'}</p>
        <p class="description">${city.currentWeather.description || 'N/A'}</p>
        ${city.currentWeather.feelsLike ? `<p class="feels-like">Feels like ${city.currentWeather.feelsLike}°C</p>` : ''}
        <div class="weather-stats">
          ${city.currentWeather.humidity ? `<span>💧 ${city.currentWeather.humidity}%</span>` : ''}
          ${city.currentWeather.windSpeed ? `<span>💨 ${city.currentWeather.windSpeed} km/h</span>` : ''}
        </div>
      </div>
      ${city.forecast && city.forecast.length > 0 ? `
      <div class="forecast-section">
        <h4>5-Day Forecast</h4>
        <div class="forecast-grid">
          ${city.forecast.map(day => `
            <div class="forecast-day">
              <div class="forecast-date">${new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div class="forecast-temps">
                <span class="temp-max">${day.maxTemp}°</span>
                <span class="temp-min">${day.minTemp}°</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      <div class="city-actions">
        <button class="btn-favorite ${city.isFavorite ? 'active' : ''}" onclick="toggleFavorite('${city._id}')">
          ${city.isFavorite ? '★' : '☆'}
        </button>
        <button class="btn-delete" onclick="deleteCity('${city._id}')">Delete</button>
      </div>
    </div>
  `
    )
    .join('');
};

const addCity = async (cityName) => {
  const token = getToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/cities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cityName }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.message || 'Failed to add city');
      return;
    }

    await fetchCities();
    clearAddCityForm();
  } catch (error) {
    showError('Failed to add city. Please try again.');
    console.error(error);
  }
};

const toggleFavorite = async (cityId) => {
  const token = getToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/cities/${cityId}/favorite`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to update favorite');
    }

    await fetchCities();
  } catch (error) {
    showError('Failed to update favorite. Please try again.');
    console.error(error);
  }
};

const deleteCity = async (cityId) => {
  const token = getToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/cities/${cityId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete city');
    }

    await fetchCities();
  } catch (error) {
    showError('Failed to delete city. Please try again.');
    console.error(error);
  }
};

const showLoading = () => {
  const container = document.getElementById('citiesContainer');
  container.innerHTML = '<p class="loading-message">Loading cities...</p>';
};

const showError = (message) => {
  const errorDiv = document.getElementById('errorMessage');
  if (errorDiv) {
    errorDiv.textContent = message;
    setTimeout(() => {
      errorDiv.textContent = '';
    }, 3000);
  }
};

const clearAddCityForm = () => {
  const input = document.getElementById('cityInput');
  if (input) {
    input.value = '';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  fetchUserProfile();
  fetchCities();

  const addCityForm = document.getElementById('addCityForm');
  if (addCityForm) {
    addCityForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const cityInput = document.getElementById('cityInput');
      const cityName = cityInput.value.trim();
      if (cityName) {
        addCity(cityName);
      }
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    });
  }
});
