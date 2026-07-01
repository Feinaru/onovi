import { useState, useEffect } from 'react';
import { api } from '../../../../api';

/**
 * useTags - Manage user tags
 */
function useTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchTags() {
    setLoading(true);
    setError(null);

    try {
      const tagsData = await api('/api/admin/users/tags/list');
      setTags(tagsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTags();
  }, []);

  async function createTag(tagData) {
    try {
      const newTag = await api('/api/admin/users/tags/create', {
        method: 'POST',
        body: JSON.stringify(tagData)
      });
      setTags([...tags, newTag]);
      return newTag;
    } catch (err) {
      throw err;
    }
  }

  async function updateTag(tagId, updates) {
    try {
      const updated = await api(`/api/admin/users/tags/${tagId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      setTags(tags.map(t => t.id === tagId ? updated : t));
      return updated;
    } catch (err) {
      throw err;
    }
  }

  async function deleteTag(tagId) {
    try {
      await api(`/api/admin/users/tags/${tagId}`, {
        method: 'DELETE'
      });
      setTags(tags.filter(t => t.id !== tagId));
    } catch (err) {
      throw err;
    }
  }

  return {
    tags,
    loading,
    error,
    refetch: fetchTags,
    createTag,
    updateTag,
    deleteTag
  };
}

export default useTags;
