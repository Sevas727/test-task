import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchForm } from '../SearchForm/SearchForm';

describe('SearchForm', () => {
  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  describe('rendering', () => {
    it('renders an input with placeholder text', () => {
      render(<SearchForm onSearch={vi.fn()} />);

      expect(screen.getByPlaceholderText('Enter city name...')).toBeInTheDocument();
    });

    it('renders a Search button', () => {
      render(<SearchForm onSearch={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    });

    it('has an accessible label on the input', () => {
      render(<SearchForm onSearch={vi.fn()} />);

      expect(screen.getByLabelText('City name')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Submit behaviour
  // -------------------------------------------------------------------------

  describe('submit', () => {
    it('calls onSearch with the trimmed city name on submit', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();

      render(<SearchForm onSearch={onSearch} />);

      await user.type(screen.getByLabelText('City name'), '  London  ');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      expect(onSearch).toHaveBeenCalledWith('London');
    });

    it('does not call onSearch when input is empty', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();

      render(<SearchForm onSearch={onSearch} />);

      await user.click(screen.getByRole('button', { name: 'Search' }));

      expect(onSearch).not.toHaveBeenCalled();
    });

    it('does not call onSearch when input is only whitespace', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();

      render(<SearchForm onSearch={onSearch} />);

      await user.type(screen.getByLabelText('City name'), '   ');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      expect(onSearch).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  describe('loading state', () => {
    it('disables the input when loading', () => {
      render(<SearchForm onSearch={vi.fn()} loading={true} />);

      expect(screen.getByLabelText('City name')).toBeDisabled();
    });

    it('shows "Searching..." text on the button when loading', () => {
      render(<SearchForm onSearch={vi.fn()} loading={true} />);

      expect(screen.getByRole('button', { name: 'Searching...' })).toBeInTheDocument();
    });

    it('disables the button when loading', () => {
      render(<SearchForm onSearch={vi.fn()} loading={true} />);

      expect(screen.getByRole('button', { name: 'Searching...' })).toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // Button disabled state
  // -------------------------------------------------------------------------

  describe('button disabled state', () => {
    it('disables the Search button when input is empty', () => {
      render(<SearchForm onSearch={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
    });

    it('enables the Search button when input has text', async () => {
      const user = userEvent.setup();
      render(<SearchForm onSearch={vi.fn()} />);

      await user.type(screen.getByLabelText('City name'), 'London');

      expect(screen.getByRole('button', { name: 'Search' })).toBeEnabled();
    });
  });
});
