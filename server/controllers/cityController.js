const axios = require('axios');
const City = require('../models/City');

const createCity = async (req, res) => {
  try {
    const { cityName, country } = req.body;

    const city = await City.create({
      userId: req.userId,
      cityName,
      country,
    });

    res.status(201).json(city);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'City already added' });
    }
    res.status(500).json({ message: error.message });
  }
};

const getCities = async (req, res) => {
  try {
    const cities = await City.find({ userId: req.userId }).sort({ addedAt: -1 });

    const citiesWithWeather = await Promise.all(
      cities.map(async (city) => {
        try {
          const response = await axios.get(
            `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city.cityName)}`,
            {
              params: {
                unitGroup: 'metric',
                key: process.env.WEATHER_API_KEY,
                contentType: 'json',
              },
            }
          );

          const current = response.data.currentConditions;
          const forecastDays = response.data.days.slice(1, 6).map(day => ({
            date: day.datetime,
            minTemp: Math.round(day.tempmin),
            maxTemp: Math.round(day.tempmax),
            description: day.conditions,
            icon: day.icon,
          }));

          return {
            _id: city._id,
            cityName: city.cityName,
            isFavorite: city.favorite,
            currentWeather: {
              temperature: Math.round(current.temp),
              description: current.conditions.toLowerCase(),
              feelsLike: Math.round(current.feelslike),
              humidity: current.humidity,
              windSpeed: current.windspeed,
            },
            forecast: forecastDays,
          };
        } catch (error) {
          return {
            _id: city._id,
            cityName: city.cityName,
            isFavorite: city.favorite,
            currentWeather: {
              temperature: null,
              description: 'unavailable',
            },
            forecast: [],
          };
        }
      })
    );

    const favorites = citiesWithWeather.filter(city => city.isFavorite);

    res.json({
      favorites,
      cities: citiesWithWeather,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const city = await City.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }

    city.favorite = !city.favorite;
    await city.save();

    res.json(city);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCity = async (req, res) => {
  try {
    const city = await City.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }

    await city.deleteOne();
    res.json({ message: 'City removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCity, getCities, toggleFavorite, deleteCity };
