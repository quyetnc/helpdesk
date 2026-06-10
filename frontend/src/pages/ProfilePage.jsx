import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import { Button } from '../components/Button';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.patch(`/users/${user.id}`, { name });
      toast.success('Profile updated successfully');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Information</h2>

        <div className="space-y-4 mb-6">
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Email</div>
            <p className="text-gray-900 px-3 py-2 bg-gray-50 rounded-lg">{user?.email}</p>
          </div>

          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Role</div>
            <p className="text-gray-900 px-3 py-2 bg-gray-50 rounded-lg">
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-900 rounded text-sm font-medium">
                {user?.role}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Update Profile</h2>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button type="submit" disabled={loading} isLoading={loading} variant="primary">
            {loading ? 'Saving...' : 'Update Profile'}
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h2>
        <Button onClick={logout} variant="danger">
          Logout
        </Button>
      </div>
    </div>
  );
}
