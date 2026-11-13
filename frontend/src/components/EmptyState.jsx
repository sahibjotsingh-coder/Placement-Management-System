export default function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      {message && <p className="text-sm text-gray-500 mb-4">{message}</p>}
      {action}
    </div>
  );
}