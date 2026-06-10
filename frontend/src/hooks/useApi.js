import { useState, useCallback } from 'react';
import api from '../api/client';

/**
 * useApi hook — Generic HTTP request handler
 * Handles loading, error, and data states for any API call
 */
export function useApi() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(
    async (method, url, requestData = null, config = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api({
          method,
          url,
          data: requestData,
          ...config,
        });

        setData(response.data);
        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const get = useCallback(
    (url, config) => request('GET', url, null, config),
    [request]
  );

  const post = useCallback(
    (url, data, config) => request('POST', url, data, config),
    [request]
  );

  const patch = useCallback(
    (url, data, config) => request('PATCH', url, data, config),
    [request]
  );

  const delete_ = useCallback(
    (url, config) => request('DELETE', url, null, config),
    [request]
  );

  return {
    data,
    loading,
    error,
    request,
    get,
    post,
    patch,
    delete: delete_,
  };
}
