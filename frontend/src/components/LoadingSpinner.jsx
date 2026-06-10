/**
 * LoadingSpinner — centered animated spinner
 */
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent" />
      <span className="ml-3 text-gray-600 font-medium">Loading...</span>
    </div>
  );
}
