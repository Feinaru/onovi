import { useState, useEffect } from 'react';
import { api } from '../../../../api';

/**
 * useUsers - Fetch and manage user list with filters
 */
function useUsers(filters = {}) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  async function fetchUsers() {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: filters.page || 1,
        limit: filters.limit || 20,
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.tags && { tags: filters.tags.join(',') }),
        ...(filters.from && { from: filters.from }),
        ...(filters.to && { to: filters.to }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.order && { order: filters.order })
      });

      const result = await api(`/api/admin/users?${queryParams}`);
      
      setUsers(result.users);
      setPagination({
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const statsData = await api('/api/admin/users/stats');
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    users,
    stats,
    loading,
    error,
    pagination,
    refetch: fetchUsers,
    refetchStats: fetchStats
  };
}

export default useUsers;
