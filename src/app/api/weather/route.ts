// src/app/api/weather/route.ts
// This file is a route handler for the weather API
// It uses the OpenWeatherMap API to fetch weather data for a given city
// It returns the weather data in JSON format
// It is a serverless function that is called by the Weather component


import { NextRequest, NextResponse } from 'next/server';
import { WeatherData } from '@/types/weather';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') || 'Manteca, CA';

  const lat = 42.9832406;
  const lon = -81.243372;
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
    );

    if (!response.ok) {
      console.error('Failed to fetch weather data:', response.statusText);
      throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();

    const weatherData: WeatherData = {
      city,
      temperature: data.main.temp,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
    };

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}
