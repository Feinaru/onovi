import React, { useState } from 'react';
import useUsers from './hooks/useUsers';
import useTags from './hooks/useTags';
import UserFilters from './components/UserFilters';
import UserStats from './components/UserStats';
import UserTable from './components/UserTable';
import UserDrawer from './components/UserDrawer';
import './UsersPage.css';

/**
 * UsersPage - Main admin user management interface
 */
function UsersPage() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    role: '',
    status: '',
    search: '',
    tags: [],
    sortBy: 'createdAt',
    order: 'desc'
  });

  const [selectedUserId, setSelectedUserId] = useState(null);
  const { users, stats, loading, pagination, refetch, refetchStats } = useUsers(filters);
  const { tags } = useTags();

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }

  function handlePageChange(newPage) {
    setFilters(prev => ({ ...prev, page: newPage }));
  }

  function handleUserClick(userId) {
    setSelectedUserId(userId);
  }

  function handleCloseDrawer() {
    setSelectedUserId(null);
  }

  function handleUserUpdated() {
    refetch();
    refetchStats();
  }

  return (
    <div className="users-page">
      <div className="users-page-header">
        <h1>ניהול משתמשים</h1>
        <p className="users-page-description">
          ניהול מלא של כל המשתמשים במערכת - לקוחות ובעלי עסקים
        </p>
      </div>

      {stats && <UserStats stats={stats} />}

      <div className="users-page-content">
        <UserFilters
          filters={filters}
          tags={tags}
          onChange={handleFilterChange}
        />

        <UserTable
          users={users}
          loading={loading}
          pagination={pagination}
          onUserClick={handleUserClick}
          onPageChange={handlePageChange}
        />
      </div>

      <UserDrawer
        userId={selectedUserId}
        isOpen={!!selectedUserId}
        onClose={handleCloseDrawer}
        onUserUpdated={handleUserUpdated}
        availableTags={tags}
      />
    </div>
  );
}

export default UsersPage;
