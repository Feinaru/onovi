import { useState } from 'react';

/**
 * useBusinessForms - Hook for managing business form states
 */
export function useBusinessForms(categories) {
  const [businessForm, setBusinessForm] = useState({
    name: '',
    description: '',
    phone: '',
    identifierType: 'COMPANY_NUMBER',
    identifierValue: '',
    cityCode: null,
    cityNameHebrew: '',
    streetCode: null,
    streetNameHebrew: '',
    houseNumber: '',
    formattedAddress: '',
    latitude: null,
    longitude: null,
    categoryId: categories.length > 0 ? categories[0].id : 1,
    isComplete: false
  });

  const [serviceForm, setServiceForm] = useState({
    businessId: '',
    name: '',
    durationMinutes: 60,
    regularPrice: 250,
    description: ''
  });

  const [slotForm, setSlotForm] = useState({
    businessId: '',
    serviceId: '',
    date: '2026-06-25',
    startTime: '17:30',
    endTime: '18:30',
    regularPrice: 250,
    dealPrice: 190
  });

  const [editingBusiness, setEditingBusiness] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);

  function resetBusinessForm() {
    setBusinessForm({
      name: '',
      description: '',
      phone: '',
      identifierType: 'COMPANY_NUMBER',
      identifierValue: '',
      cityCode: null,
      cityNameHebrew: '',
      streetCode: null,
      streetNameHebrew: '',
      houseNumber: '',
      formattedAddress: '',
      latitude: null,
      longitude: null,
      categoryId: categories.length > 0 ? categories[0].id : 1,
      isComplete: false
    });
  }

  return {
    businessForm,
    setBusinessForm,
    serviceForm,
    setServiceForm,
    slotForm,
    setSlotForm,
    editingBusiness,
    setEditingBusiness,
    editingService,
    setEditingService,
    editingSlot,
    setEditingSlot,
    resetBusinessForm
  };
}
