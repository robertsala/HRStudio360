import React, { useState } from 'react';
import { X, MapPin, Loader, Navigation } from 'lucide-react';
import { weatherService } from '../../utils/weatherService';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ResizableModal from '../ResizableModal';

interface LocationOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationUpdated?: () => void;
}

const LocationOverrideModal: React.FC<LocationOverrideModalProps> = ({
  isOpen,
  onClose,
  onLocationUpdated,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateZipCode = (zip: string): boolean => {
    // US Zip code: 5 digits or 5+4 digits with hyphen
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zip);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!validateZipCode(zipCode)) {
      setError(t('locationModal.invalidZipCode'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get coordinates from zip code
      const location = await weatherService.getCoordinatesFromZipCode(zipCode);

      if (!location) {
        setError(t('locationModal.locationNotFound'));
        setLoading(false);
        return;
      }

      // Update user location with manual override flag
      const updated = await weatherService.updateUserLocation(
        user.id,
        {
          lat: location.lat,
          lon: location.lon,
          city: location.city,
          state: location.state,
          zipCode: zipCode,
        },
        true // manual override
      );

      if (updated) {
        setSuccess(true);
        setTimeout(() => {
          if (onLocationUpdated) {
            onLocationUpdated();
          }
          onClose();
        }, 1500);
      } else {
        setError(t('locationModal.updateFailed'));
      }
    } catch (err) {
      console.error('Error updating location:', err);
      setError(t('locationModal.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDetectLocation = async () => {
    if (!user) return;

    setDetecting(true);
    setError(null);
    setSuccess(false);

    try {
      const coords = await weatherService.detectUserLocation();

      if (!coords) {
        setError(t('locationModal.locationDetectionFailed'));
        setDetecting(false);
        return;
      }

      // Get location name from coordinates
      const locationName = await weatherService.getLocationName(coords.lat, coords.lon);

      if (!locationName) {
        setError(t('locationModal.locationDetectionFailed'));
        setDetecting(false);
        return;
      }

      // Update user location
      const updated = await weatherService.updateUserLocation(
        user.id,
        {
          lat: coords.lat,
          lon: coords.lon,
          city: locationName.city,
          state: locationName.state,
        },
        false // not manual override
      );

      if (updated) {
        setSuccess(true);
        setTimeout(() => {
          if (onLocationUpdated) {
            onLocationUpdated();
          }
          onClose();
        }, 1500);
      } else {
        setError(t('locationModal.updateFailed'));
      }
    } catch (err) {
      console.error('Error detecting location:', err);
      setError(t('locationModal.updateError'));
    } finally {
      setDetecting(false);
    }
  };

  const handleClose = () => {
    if (!loading && !detecting) {
      setZipCode('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <ResizableModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('locationModal.title')}
      size="sm"
    >
      <div className="p-6">
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {t('locationModal.description')}
          </p>

          {/* Auto-detect location button */}
          <button
            onClick={handleDetectLocation}
            disabled={detecting || loading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {detecting ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>{t('locationModal.detectingLocation')}</span>
              </>
            ) : (
              <>
                <Navigation className="h-5 w-5" />
                <span>{t('locationModal.detectLocation')}</span>
              </>
            )}
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            <span className="px-3 text-sm text-gray-500 dark:text-gray-400">{t('locationModal.orDivider')}</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          {/* Manual zip code entry */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('locationModal.enterZipCode')}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder={t('locationModal.zipCodePlaceholder')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={loading || detecting}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  {t('locationModal.locationUpdated')}
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading || detecting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('locationModal.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || detecting || !zipCode}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>{t('locationModal.updating')}</span>
                  </>
                ) : (
                  <span>{t('locationModal.setLocationButton')}</span>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            <strong>{t('locationModal.privacyNote')}</strong>{t('locationModal.privacyNoteText')}
          </p>
        </div>
      </div>
    </ResizableModal>
  );
};

export default LocationOverrideModal;
