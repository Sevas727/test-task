# Technical Plan: Weather Forecast App

## 1. Project Setup

- Initialize Vite + React + TypeScript project
- Setup Tailwind CSS
- Setup Vitest + React Testing Library
- Setup ESLint + Prettier
- Setup pre-commit hooks (husky + lint-staged)

## 2. Architecture and Project Structure

```
src/
├── components/          # React components
│   ├── SearchForm/     # City search form
│   ├── WeatherCard/    # Weather display
│   ├── SearchHistory/  # Search history
│   └── UndoNotification/ # Undo notification
├── hooks/              # Custom hooks
│   ├── useWeatherApi   # Weather API operations
│   ├── useSearchHistory # History management
│   └── useUndo         # Undo logic
├── services/           # Business logic
│   ├── weatherApi.ts   # API client
│   └── storage.ts      # localStorage wrapper
├── types/              # TypeScript types
├── utils/              # Helper functions
└── __tests__/          # Tests
```

## 3. Key Functional Modules

### 3.1 Weather API Integration

- Use OpenWeatherMap API (free tier)
- Create type-safe API client
- Error handling (network, invalid city, rate limits)
- Request caching (optional)

### 3.2 Search History Management

- Store in localStorage
- Structure: `{ id, cityName, country, timestamp, weatherSnapshot }`
- Limit history size (e.g., max 10 entries)
- City deduplication

### 3.3 Undo Functionality

- Stack of deleted items
- Undo timeout (e.g., 5 seconds)
- Toast/Snackbar notification with Undo button

## 4. User Stories Implementation

### US1: Weather Display

**Components**: `WeatherCard`, `SearchForm`

- Current temperature (with weather icon)
- Weather description
- Min/Max temperatures
- Wind speed
- Additional: humidity, feels like temperature

### US2: Search History

**Components**: `SearchHistory`, `HistoryItem`

- List with city cards
- Timestamp for each search
- Sorting (newest first)

### US3: Click History Item

**Functionality**:

- onClick handler → fetch weather for city
- Update timestamp in history

### US4: Remove History Item

**Functionality**:

- Delete button on each item
- Confirm dialog (optional)
- Delete animation

### US5: Undo Remove

**Functionality**:

- Toast notification with "Undo" button
- 5-second timer
- Restore deleted item

## 5. Design Principles (SOLID)

- **Single Responsibility**: Each component/hook has one responsibility
- **Open/Closed**: Extensibility through props/interfaces
- **Dependency Inversion**: Dependency injection for API/storage
- **Patterns**:
  - Custom hooks for reusability
  - Context API for global state (if needed)
  - Command pattern for Undo

## 6. Testing Strategy

### Unit Tests

- Utility functions (date formatting, temperature conversion)
- API service (with mock fetch)
- Storage service
- Custom hooks (with renderHook)

### Integration Tests

- SearchForm submission → API call → display results
- History click → fetch weather
- Remove + Undo flow

### Coverage Target

- Minimum 80% coverage
- 100% for critical flows (search, history operations)

## 7. Error Handling

- Network errors → retry with exponential backoff
- Invalid city → user-friendly message
- API rate limits → inform user
- Empty states (no history, no results)
- Loading states for all async operations

## 8. UI/UX Enhancements

- Responsive design (mobile-first)
- Loading skeletons
- Smooth transitions (Tailwind transitions)
- Weather icons (e.g., openweathermap icons or lucide-react)
- Dark mode support (optional)

## 9. Documentation

- **README.md**:
  - How to run (`npm install`, `npm run dev`)
  - How to test (`npm test`, `npm run coverage`)
  - How to build (`npm run build`)
  - API key setup instructions
  - Architecture decisions

- **Inline comments** for complex logic
- **JSDoc** for public API functions
- **Type definitions** as documentation

## 10. Implementation Order

1. Basic project setup + CI config
2. Weather API service + types
3. SearchForm component + weather display
4. localStorage service for history
5. Search history UI + CRUD operations
6. Undo functionality
7. Error handling + loading states
8. Styling + responsive design
9. Unit/integration tests
10. Documentation + cleanup

## 11. Technical Details

### Dependencies

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.x",
    "typescript": "^5.x",
    "vitest": "^1.x",
    "@testing-library/react": "^14.x",
    "@testing-library/jest-dom": "^6.x",
    "tailwindcss": "^3.x",
    "eslint": "^8.x",
    "prettier": "^3.x"
  }
}
```

### Environment Variables

```
VITE_WEATHER_API_KEY=your_api_key
VITE_WEATHER_API_URL=https://api.openweathermap.org/data/2.5
```

## 12. Production-Ready Considerations

- **Performance**:
  - Memoization for expensive computations
  - Debouncing for search input
  - Lazy loading for components

- **Accessibility**:
  - Semantic HTML
  - ARIA labels
  - Keyboard navigation

- **Security**:
  - API key protection (environment variables)
  - Input sanitization
  - XSS prevention

- **Build Optimization**:
  - Code splitting
  - Asset optimization
  - Bundle size analysis

## 13. Optional Enhancements

- **Extended Forecast**: 5-day weather forecast
- **Geolocation**: Automatic weather for current location
- **Unit Toggle**: Celsius/Fahrenheit switch
- **Favorites**: Pin favorite cities
- **PWA**: Offline support with service workers
- **i18n**: Multi-language support
