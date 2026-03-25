import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UndoNotification } from '../UndoNotification/UndoNotification';

describe('UndoNotification', () => {
  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  describe('rendering', () => {
    it('displays the provided message', () => {
      render(<UndoNotification message="Item removed" onUndo={vi.fn()} onClose={vi.fn()} />);

      expect(screen.getByText('Item removed')).toBeInTheDocument();
    });

    it('renders an Undo button', () => {
      render(<UndoNotification message="Deleted" onUndo={vi.fn()} onClose={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    });

    it('renders a close button with accessible label', () => {
      render(<UndoNotification message="Deleted" onUndo={vi.fn()} onClose={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Close notification' })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Interactions
  // -------------------------------------------------------------------------

  describe('interactions', () => {
    it('calls onUndo when the Undo button is clicked', async () => {
      const onUndo = vi.fn();
      const user = userEvent.setup();

      render(<UndoNotification message="Deleted" onUndo={onUndo} onClose={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: 'Undo' }));

      expect(onUndo).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when the close button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<UndoNotification message="Deleted" onUndo={vi.fn()} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Close notification' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
