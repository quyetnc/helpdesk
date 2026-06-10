import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="text-2xl font-semibold text-gray-700 mt-4">Page Not Found</p>
        <p className="text-gray-600 mt-2">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link to="/dashboard" className="mt-8 inline-block">
          <Button variant="primary">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
