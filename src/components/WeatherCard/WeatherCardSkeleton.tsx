export const WeatherCardSkeleton = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading weather data"
      className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md animate-pulse"
    >
      {/* Location placeholder */}
      <div className="flex justify-center mb-4">
        <div className="h-7 w-40 bg-gray-200 rounded" />
      </div>

      {/* Main weather info placeholder */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-24 h-24 bg-gray-200 rounded-full" />
        <div className="ml-4 text-center">
          <div className="h-12 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-5 w-20 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Additional info placeholders */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="h-4 w-16 bg-gray-200 rounded mx-auto mb-2" />
            <div className="h-6 w-12 bg-gray-200 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};
