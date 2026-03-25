import './App.css';
import { lazy, Suspense, useCallback } from 'react';
import { useWeatherApi, useSearchHistory, useUndo } from './hooks';
import { SearchForm, WeatherCardSkeleton } from './components';
import type { SearchHistoryItem } from './types';

const WeatherCard = lazy(() =>
  import('./components/WeatherCard/WeatherCard').then((m) => ({ default: m.WeatherCard }))
);
const SearchHistory = lazy(() =>
  import('./components/SearchHistory/SearchHistory').then((m) => ({ default: m.SearchHistory }))
);
const UndoNotification = lazy(() =>
  import('./components/UndoNotification/UndoNotification').then((m) => ({
    default: m.UndoNotification,
  }))
);

function App() {
  const { data, loading, error, fetchWeather, clearError } = useWeatherApi();
  const { history, addToHistory, removeFromHistory, restoreToHistory } = useSearchHistory();
  const { undoItem, setUndoItem, executeUndo, clearUndo } =
    useUndo<SearchHistoryItem>(restoreToHistory);

  const handleSearch = useCallback(
    (cityName: string) => {
      clearError();
      fetchWeather(cityName)
        .then((weatherData) => {
          addToHistory(weatherData);
        })
        .catch(() => {
          // error state is handled by the hook
        });
    },
    [clearError, fetchWeather, addToHistory]
  );

  const handleHistoryClick = useCallback(
    (cityName: string) => {
      handleSearch(cityName);
    },
    [handleSearch]
  );

  const handleHistoryRemove = useCallback(
    (id: string) => {
      const removedItem = removeFromHistory(id);
      if (removedItem) {
        setUndoItem(removedItem);
      }
    },
    [removeFromHistory, setUndoItem]
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-8">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-blue-500 focus:text-white focus:px-4 focus:py-2 focus:rounded"
      >
        Skip to main content
      </a>

      <header>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Weather Forecast</h1>
      </header>

      <main id="main-content" className="w-full flex flex-col items-center">
        <section className="w-full max-w-md mb-6" aria-label="Search">
          <SearchForm onSearch={handleSearch} loading={loading} />
        </section>

        {error && (
          <div role="alert" className="w-full max-w-md mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <section aria-label="Weather results" aria-live="polite" className="w-full max-w-md">
          {loading && <WeatherCardSkeleton />}

          {data && !loading && (
            <Suspense fallback={<WeatherCardSkeleton />}>
              <div className="animate-fade-in">
                <WeatherCard data={data} />
              </div>
            </Suspense>
          )}
        </section>

        <section className="w-full max-w-md mt-8" aria-label="Search history">
          <Suspense fallback={null}>
            <SearchHistory
              history={history}
              onItemClick={handleHistoryClick}
              onItemRemove={handleHistoryRemove}
            />
          </Suspense>
        </section>
      </main>

      {undoItem && (
        <Suspense fallback={null}>
          <UndoNotification
            message={`${undoItem.cityName} removed from history`}
            onUndo={executeUndo}
            onClose={clearUndo}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
