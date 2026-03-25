# Weather Forecast Application

A production-ready weather forecast application built with React, TypeScript, and Vite. This application allows users to search for weather information by city, view search history, and manage their searches with undo functionality.

## Features

- 🌤️ Real-time weather data from OpenWeatherMap API
- 🔍 City search with current weather display
- 📜 Search history with timestamp
- 🗑️ Remove history items with undo functionality
- 📱 Responsive design (mobile-first approach)
- 🎨 Modern UI with Tailwind CSS
- ✅ Comprehensive test coverage
- 🔒 Production-ready code quality

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **ESLint + Prettier** - Code quality and formatting
- **Husky + lint-staged** - Pre-commit hooks

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenWeatherMap API key (free tier available at https://openweathermap.org/api)

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` file in the root directory:

   ```bash
   cp .env.example .env
   ```

4. Add your OpenWeatherMap API key to `.env`:
   ```
   VITE_WEATHER_API_KEY=your_api_key_here
   VITE_WEATHER_API_URL=https://api.openweathermap.org/data/2.5
   ```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Testing

Run tests:

```bash
npm test
```

Run tests with UI:

```bash
npm run test:ui
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Code Quality

### Linting

```bash
npm run lint
```

Auto-fix linting issues:

```bash
npm run lint:fix
```

### Formatting

```bash
npm run format
```

### Pre-commit Hooks

The project uses Husky and lint-staged to run linting and formatting automatically before each commit.

## Project Structure

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
└── test/               # Test setup and utilities
```

## Architecture Principles

This project follows production-ready practices:

- **SOLID Principles**: Single responsibility, dependency inversion
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Testing**: Unit and integration tests with high coverage
- **Code Quality**: ESLint with type-aware rules, Prettier formatting
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation
- **Performance**: Memoization, debouncing, lazy loading
- **Security**: Environment variables for API keys, input sanitization

## License

This project is private and created as a test task for a company.
