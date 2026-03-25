import { memo } from 'react';
import type { WeatherData } from '../../types';
import { getWeatherIconUrl } from '../../utils';

interface WeatherCardProps {
  data: WeatherData;
}

export const WeatherCard = memo(({ data }: WeatherCardProps) => {
  const iconUrl = getWeatherIconUrl(data.weather[0].icon, 'large');

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      {/* Location */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {data.name}, {data.sys.country}
        </h2>
      </div>

      {/* Main weather info */}
      <div className="flex items-center justify-center mb-6">
        <img src={iconUrl} alt={data.weather[0].description} className="w-24 h-24" />
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-800">{Math.round(data.main.temp)}°C</div>
          <div className="text-gray-600 capitalize mt-2">{data.weather[0].description}</div>
        </div>
      </div>

      {/* Additional info */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="text-gray-500 text-sm">Feels like</div>
          <div className="text-lg font-semibold text-gray-800">
            {Math.round(data.main.feels_like)}°C
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-500 text-sm">Humidity</div>
          <div className="text-lg font-semibold text-gray-800">{data.main.humidity}%</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500 text-sm">Min / Max</div>
          <div className="text-lg font-semibold text-gray-800">
            {Math.round(data.main.temp_min)}° / {Math.round(data.main.temp_max)}°
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-500 text-sm">Wind Speed</div>
          <div className="text-lg font-semibold text-gray-800">{data.wind.speed} m/s</div>
        </div>
      </div>
    </div>
  );
});

WeatherCard.displayName = 'WeatherCard';
