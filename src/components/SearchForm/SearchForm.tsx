import { useState, FormEvent } from 'react';

interface SearchFormProps {
  onSearch: (cityName: string) => void;
  loading?: boolean;
}

export const SearchForm = ({ onSearch, loading = false }: SearchFormProps) => {
  const [cityName, setCityName] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedCity = cityName.trim();
    if (trimmedCity) {
      onSearch(trimmedCity);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <input
          type="text"
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
          placeholder="Enter city name..."
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          aria-label="City name"
        />
        <button
          type="submit"
          disabled={loading || !cityName.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
};
