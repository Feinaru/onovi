import { useState, useEffect } from 'react';
import { api } from '../../../../api';

/**
 * useUserDetails - Fetch full user details with relations
 */
function useUserDetails(userId) {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchUserDetails() {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [userData, notesData, activitiesData, readinessData] = await Promise.all([
        api(`/api/admin/users/${userId}`),
        api(`/api/admin/users/${userId}/notes`),
        api(`/api/admin/users/${userId}/activity`),
        api(`/api/admin/users/${userId}/readiness`)
      ]);

      setUser(userData);
      setNotes(notesData);
      setActivities(activitiesData);
      setReadiness(readinessData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  async function updateUser(updates) {
    try {
      const updated = await api(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      setUser(updated);
      return updated;
    } catch (err) {
      throw err;
    }
  }

  async function changeStatus(status, reason) {
    try {
      const updated = await api(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason })
      });
      setUser(updated);
      return updated;
    } catch (err) {
      throw err;
    }
  }

  async function addNote(content) {
    try {
      const note = await api(`/api/admin/users/${userId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      setNotes([note, ...notes]);
      return note;
    } catch (err) {
      throw err;
    }
  }

  async function addTag(tagId) {
    try {
      const result = await api(`/api/admin/users/${userId}/tags`, {
        method: 'POST',
        body: JSON.stringify({ tagId })
      });
      await fetchUserDetails(); // Refresh to get updated tags
      return result;
    } catch (err) {
      throw err;
    }
  }

  async function removeTag(tagId) {
    try {
      const result = await api(`/api/admin/users/${userId}/tags/${tagId}`, {
        method: 'DELETE'
      });
      await fetchUserDetails(); // Refresh to get updated tags
      return result;
    } catch (err) {
      throw err;
    }
  }

  return {
    user,
    notes,
    activities,
    readiness,
    loading,
    error,
    refetch: fetchUserDetails,
    updateUser,
    changeStatus,
    addNote,
    addTag,
    removeTag
  };
}

export default useUserDetails;
