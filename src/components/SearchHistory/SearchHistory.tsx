import type { SearchHistoryItem } from '../../types';

interface SearchHistoryProps {
  history: SearchHistoryItem[];
  onItemClick: (cityName: string) => void;
  onItemRemove: (id: string) => void;
}

export const SearchHistory = ({ history, onItemClick, onItemRemove }: SearchHistoryProps) => {
  if (history.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No search history yet. Search for a city to get started!</p>
      </div>
    );
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Search History</h2>
      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => onItemClick(item.cityName)}
                className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
                aria-label={`View weather for ${item.cityName}`}
              >
                <img
                  src={`https://openweathermap.org/img/wn/${item.weatherSnapshot.icon}.png`}
                  alt={item.weatherSnapshot.description}
                  className="w-12 h-12"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">
                    {item.cityName}, {item.country}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {item.weatherSnapshot.description}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatTimestamp(item.timestamp)}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {Math.round(item.weatherSnapshot.temperature)}°C
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onItemRemove(item.id);
                }}
                className="ml-4 text-red-500 hover:text-red-700 transition-colors p-2"
                aria-label={`Remove ${item.cityName} from history`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
