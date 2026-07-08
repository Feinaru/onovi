import React, { useState, useEffect } from 'react';
import { api } from '../../../api';
import './BusinessProfilePage.css';

/**
 * BusinessProfilePage - Customer-facing public business profile
 * Shows business details, services, images, and booking CTA
 */
export default function BusinessProfilePage({ businessId, setView }) {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBusiness();
  }, [businessId]);

  async function loadBusiness() {
    try {
      setLoading(true);
      setError(null);
      const data = await api(`/businesses/${businessId}`);
      setBusiness(data);
    } catch (err) {
      console.error('Failed to load business profile:', err);
      setError(err.message || 'העסק אינו זמין כרגע');
    } finally {
      setLoading(false);
    }
  }

  function handleBackToSearch() {
    setView('customer');
  }

  // Parse gallery images safely
  function getGalleryImages() {
    if (!business?.galleryImages) return [];
    try {
      const parsed = JSON.parse(business.galleryImages);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Failed to parse gallery images:', e);
      return [];
    }
  }

  if (loading) {
    return (
      <div className="business-profile-page">
        <div className="business-profile-loading">
          <div className="spinner"></div>
          <p>טוען פרופיל עסק...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="business-profile-page">
        <div className="business-profile-error">
          <div className="error-icon">⚠️</div>
          <h2>{error}</h2>
          <p>העסק שחיפשת אינו זמין או לא קיים במערכת</p>
          <button onClick={handleBackToSearch} className="btn-primary">
            חזרה לחיפוש
          </button>
        </div>
      </div>
    );
  }

  if (!business) return null;

  const galleryImages = getGalleryImages();
  const displayAddress = business.formattedAddress ||
    [business.streetNameHebrew || business.street, business.houseNumber, business.cityNameHebrew || business.city]
      .filter(Boolean)
      .join(' ');

  return (
    <div className="business-profile-page">
      {/* Cover & Logo Section */}
      <div className="business-profile-header">
        {business.coverImageUrl ? (
          <div
            className="business-cover-image"
            style={{ backgroundImage: `url(${business.coverImageUrl})` }}
          />
        ) : (
          <div className="business-cover-placeholder" />
        )}

        {business.logoUrl && (
          <div className="business-logo-container">
            <img src={business.logoUrl} alt={business.name} className="business-logo" />
          </div>
        )}
      </div>

      {/* Business Info Section */}
      <div className="business-profile-content">
        <div className="business-info-section">
          <h1 className="business-name">{business.name}</h1>

          <div className="business-meta">
            {business.category && (
              <span className="business-category-badge">
                {business.category.nameHebrew || business.category.name}
              </span>
            )}
            {(business.cityNameHebrew || business.city) && (
              <span className="business-city">
                📍 {business.cityNameHebrew || business.city}
              </span>
            )}
          </div>
        </div>

        {/* Address Section */}
        {displayAddress && (
          <div className="business-section">
            <h3 className="section-title">📍 כתובת</h3>
            <p className="business-address">{displayAddress}</p>
          </div>
        )}

        {/* Contact Section */}
        {business.phone && (
          <div className="business-section">
            <h3 className="section-title">📞 יצירת קשר</h3>
            <a href={`tel:${business.phone}`} className="business-phone">
              {business.phone}
            </a>
          </div>
        )}

        {/* About Section */}
        {business.description && (
          <div className="business-section">
            <h3 className="section-title">ℹ️ אודות</h3>
            <p className="business-description">{business.description}</p>
          </div>
        )}

        {/* Gallery Section */}
        {galleryImages.length > 0 && (
          <div className="business-section">
            <h3 className="section-title">🖼️ גלריה</h3>
            <div className="business-gallery">
              {galleryImages.map((imageUrl, index) => (
                <div key={index} className="gallery-item">
                  <img src={imageUrl} alt={`${business.name} - תמונה ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services Section */}
        {business.services && business.services.length > 0 && (
          <div className="business-section">
            <h3 className="section-title">💼 השירותים שלנו</h3>
            <div className="business-services">
              {business.services.map(service => (
                <div key={service.id} className="service-card">
                  <h4 className="service-name">{service.name}</h4>
                  {service.description && (
                    <p className="service-description">{service.description}</p>
                  )}
                  <div className="service-meta">
                    <span className="service-duration">
                      ⏱️ {service.durationMinutes} דקות
                    </span>
                    <span className="service-price">
                      💰 ₪{service.regularPrice}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="business-cta-section">
          <button onClick={handleBackToSearch} className="btn-primary btn-large">
            חזרה לחיפוש תורים
          </button>
        </div>
      </div>
    </div>
  );
}
