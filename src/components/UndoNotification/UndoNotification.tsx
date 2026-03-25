interface UndoNotificationProps {
  message: string;
  onUndo: () => void;
  onClose: () => void;
}

export const UndoNotification = ({ message, onUndo, onClose }: UndoNotificationProps) => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 animate-slide-up z-50">
      <span>{message}</span>
      <div className="flex gap-2">
        <button
          onClick={onUndo}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded transition-colors font-medium"
        >
          Undo
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1 hover:bg-gray-700 rounded transition-colors"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
