import React, { useState } from 'react';
import SearchFilters from './search/SearchFilters';
import SearchResults from './search/SearchResults';
import { useSearchData } from './search/hooks/useSearchData';

/**
 * CustomerPage - Main customer view orchestrator (Search v2)
 */
export default function CustomerPage({ user, setView }) {
  const {
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
  } = useSearchData();

  return (
    <div className="customer-page">
      <SearchFilters
        fields={fields}
        professions={professions}
        serviceTemplates={serviceTemplates}
        filters={filters}
        setFilters={setFilters}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
        handleFieldsChange={handleFieldsChange}
        handleProfessionsChange={handleProfessionsChange}
        handleServicesChange={handleServicesChange}
        locationStatus={locationStatus}
        locationError={locationError}
        onRequestLocation={requestLocation}
        onClearLocation={clearLocation}
      />

      <SearchResults
        businesses={businesses}
        loading={loading}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
        user={user}
        setView={setView}
      />
    </div>
  );
}
