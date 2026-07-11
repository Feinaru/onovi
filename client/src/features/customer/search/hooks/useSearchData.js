import { useState, useEffect } from 'react';
import { api } from '../../../../api';

/**
 * useSearchData - Manages appointment search data and filtering (Search v2)
 */
export function useSearchData() {
  const [businesses, setBusinesses] = useState([]);
  const [fields, setFields] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [serviceTemplates, setServiceTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error
  const [locationError, setLocationError] = useState('');
  const [filters, setFilters] = useState({
    fieldIds: [],
    professionIds: [],
    serviceTemplateIds: [],
    dateFrom: '',
    dateTo: '',
    timeBuckets: [],
    timeFrom: '',
    timeTo: '',
    useSpecificTime: false,
    sort: 'recommended',
    lat: null,
    lng: null,
    radiusKm: 10
  });

  // Load taxonomy on mount
  useEffect(() => {
    loadTaxonomy();
  }, []);

  // Load businesses when filters change
  useEffect(() => {
    loadBusinesses();
  }, [filters]);

  async function loadTaxonomy() {
    try {
      const fieldsData = await api('/api/registration/fields');
      setFields(fieldsData);
    } catch (err) {
      console.error('Failed to load fields:', err);
    }
  }

  async function loadProfessions(fieldIds) {
    if (fieldIds.length === 0) {
      setProfessions([]);
      return;
    }

    try {
      // Load professions for all selected fields
      const allProfessions = [];
      for (const fieldId of fieldIds) {
        const profs = await api(`/api/registration/fields/${fieldId}/professions`);
        allProfessions.push(...profs);
      }
      // Dedupe by id
      const unique = Array.from(new Map(allProfessions.map(p => [p.id, p])).values());
      setProfessions(unique);
    } catch (err) {
      console.error('Failed to load professions:', err);
    }
  }

  async function loadServices(professionIds) {
    if (professionIds.length === 0) {
      setServiceTemplates([]);
      return;
    }

    try {
      // Load services for all selected professions
      const allServices = [];
      for (const professionId of professionIds) {
        const services = await api(`/api/registration/professions/${professionId}/services`);
        allServices.push(...services);
      }
      // Dedupe by id
      const unique = Array.from(new Map(allServices.map(s => [s.id, s])).values());
      setServiceTemplates(unique);
    } catch (err) {
      console.error('Failed to load service templates:', err);
    }
  }

  async function loadBusinesses() {
    setLoading(true);
    try {
      const query = new URLSearchParams();

      if (filters.fieldIds.length > 0) {
        query.set('fieldIds', filters.fieldIds.join(','));
      }
      if (filters.professionIds.length > 0) {
        query.set('professionIds', filters.professionIds.join(','));
      }
      if (filters.serviceTemplateIds.length > 0) {
        query.set('serviceTemplateIds', filters.serviceTemplateIds.join(','));
      }
      if (filters.dateFrom) {
        query.set('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        query.set('dateTo', filters.dateTo);
      }
      if (filters.useSpecificTime && filters.timeFrom && filters.timeTo) {
        query.set('timeFrom', filters.timeFrom);
        query.set('timeTo', filters.timeTo);
      } else if (filters.timeBuckets.length > 0) {
        query.set('timeBuckets', filters.timeBuckets.join(','));
      }
      if (filters.sort) {
        query.set('sort', filters.sort);
      }
      if (filters.lat && filters.lng) {
        query.set('lat', filters.lat);
        query.set('lng', filters.lng);
        query.set('radiusKm', filters.radiusKm);
      }

      const response = await api(`/api/customer/appointment-search?${query.toString()}`);
      setBusinesses(response.results || []);
    } catch (err) {
      console.error('Failed to load businesses:', err);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }

  const resetFilters = () => {
    setFilters({
      fieldIds: [],
      professionIds: [],
      serviceTemplateIds: [],
      dateFrom: '',
      dateTo: '',
      timeBuckets: [],
      timeFrom: '',
      timeTo: '',
      useSpecificTime: false,
      sort: 'recommended',
      lat: null,
      lng: null,
      radiusKm: 10
    });
    setLocationStatus('idle');
    setLocationError('');
  };

  const hasActiveFilters =
    filters.fieldIds.length > 0 ||
    filters.professionIds.length > 0 ||
    filters.serviceTemplateIds.length > 0 ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.timeBuckets.length > 0 ||
    filters.timeFrom ||
    filters.timeTo;

  // Handle field selection change
  const handleFieldsChange = (selectedIds) => {
    setFilters({ ...filters, fieldIds: selectedIds, professionIds: [], serviceTemplateIds: [] });
    loadProfessions(selectedIds);
    setServiceTemplates([]);
  };

  // Handle profession selection change
  const handleProfessionsChange = (selectedIds) => {
    setFilters({ ...filters, professionIds: selectedIds, serviceTemplateIds: [] });
    loadServices(selectedIds);
  };

  // Handle service template selection change
  const handleServicesChange = (selectedIds) => {
    setFilters({ ...filters, serviceTemplateIds: selectedIds });
  };

  // Request GPS location
  const requestLocation = () => {
    setLocationStatus('loading');
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('הדפדפן שלך אינו תומך באיתור מיקום. חפש ללא מיקום או נסה דפדפן אחר.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFilters({
          ...filters,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationStatus('success');
      },
      (error) => {
        setLocationStatus('error');
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('הרשאת מיקום נדחתה. אפשר לבחור עיר ידנית או לאפשר מיקום בהגדרות הדפדפן.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError('לא ניתן לזהות את המיקום כרגע. נסה שוב או חפש ללא מיקום.');
        } else if (error.code === error.TIMEOUT) {
          setLocationError('איתור המיקום לקח יותר מדי זמן. נסה שוב או חפש ללא מיקום.');
        } else {
          setLocationError('שגיאה באיתור המיקום. נסה שוב או חפש ללא מיקום.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Clear GPS location
  const clearLocation = () => {
    setFilters({ ...filters, lat: null, lng: null });
    setLocationStatus('idle');
    setLocationError('');
  };

  return {
    businesses,
    fields,
    professions,
    serviceTemplates,
    filters,
    setFilters,
    loading,
    resetFilters,
    hasActiveFilters,
    handleFieldsChange,
    handleProfessionsChange,
    handleServicesChange,
    locationStatus,
    locationError,
    requestLocation,
    clearLocation
  };
}
