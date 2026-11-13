export default function Loading({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      <p className="mt-3 text-sm text-gray-500">{text}</p>
    </div>
  );
}