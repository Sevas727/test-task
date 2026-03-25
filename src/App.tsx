import './App.css';
import { useWeatherApi, useSearchHistory, useUndo } from './hooks';
import { SearchForm, WeatherCard, SearchHistory, UndoNotification } from './components';
import type { SearchHistoryItem } from './types';

function App() {
  const { data, loading, error, fetchWeather, clearError } = useWeatherApi();
  const { history, addToHistory, removeFromHistory, restoreToHistory } = useSearchHistory();
  const { undoItem, setUndoItem, executeUndo, clearUndo } =
    useUndo<SearchHistoryItem>(restoreToHistory);

  const handleSearch = (cityName: string) => {
    clearError();
    fetchWeather(cityName)
      .then((weatherData) => {
        addToHistory(weatherData);
      })
      .catch(() => {
        // error state is handled by the hook
      });
  };

  const handleHistoryClick = (cityName: string) => {
    handleSearch(cityName);
  };

  const handleHistoryRemove = (id: string) => {
    const removedItem = removeFromHistory(id);
    if (removedItem) {
      setUndoItem(removedItem);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Weather Forecast</h1>

      <div className="w-full max-w-md mb-6">
        <SearchForm onSearch={handleSearch} loading={loading} />
      </div>

      {error && (
        <div role="alert" className="w-full max-w-md mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {data && <WeatherCard data={data} />}

      <div className="w-full max-w-md mt-8">
        <SearchHistory
          history={history}
          onItemClick={handleHistoryClick}
          onItemRemove={handleHistoryRemove}
        />
      </div>

      {undoItem && (
        <UndoNotification
          message={`${undoItem.cityName} removed from history`}
          onUndo={executeUndo}
          onClose={clearUndo}
        />
      )}
    </div>
  );
}

export default App;
