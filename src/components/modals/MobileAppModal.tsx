import React, { useState } from 'react';
import { X, Smartphone, Download, QrCode, Apple, Play, Star, Users, Clock, Shield } from 'lucide-react';

interface MobileAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileAppModal: React.FC<MobileAppModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Handle ESC key press
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const features = [
    {
      icon: Clock,
      title: 'Time Tracking',
      description: 'Clock in/out, track breaks, and view timesheets on the go'
    },
    {
      icon: Users,
      title: 'Team Directory',
      description: 'Access employee directory and contact information'
    },
    {
      icon: Star,
      title: 'Performance Reviews',
      description: 'Complete and submit performance reviews from anywhere'
    },
    {
      icon: Shield,
      title: 'Secure Access',
      description: 'Biometric authentication and encrypted data transmission'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'features', label: 'Features' },
    { id: 'download', label: 'Download' }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto resize-both min-w-[300px] min-h-[300px]">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center">
            <Smartphone className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">HRStudio360 Mobile App</h2>
              <p className="text-purple-100">HR management on the go</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-100 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="overflow-y-auto max-h-96">
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl p-8 mx-auto w-48 h-80 flex items-center justify-center mb-6">
                    <div className="text-white text-center">
                      <Smartphone className="h-16 w-16 mx-auto mb-4" />
                      <h3 className="text-xl font-bold">HRStudio360</h3>
                      <p className="text-purple-100 text-sm">Mobile App</p>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white mb-4">Coming Soon!</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Take your HR management capabilities anywhere with our upcoming mobile application. 
                    Access all your essential HR tools from your smartphone or tablet.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Key Benefits</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                        <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Access HR tools anywhere, anytime</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                        <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Offline capability for essential functions</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                        <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Push notifications for important updates</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                        <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Biometric security and encryption</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Platform Support</h4>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <Apple className="h-6 w-6 text-gray-600 dark:text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white dark:text-white">iOS App</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">iPhone and iPad compatible</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <Play className="h-6 w-6 text-gray-600 dark:text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white dark:text-white">Android App</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Android 8.0 and above</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Mobile App Features</h3>
                
                <div className="grid gap-6">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                        <div className="flex items-start space-x-4">
                          <div className="bg-purple-100 rounded-lg p-3">
                            <Icon className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-2">{feature.title}</h4>
                            <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-4">Additional Mobile Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div className="space-y-2">
                      <p>• GPS-based time tracking</p>
                      <p>• Photo capture for expense reports</p>
                      <p>• Voice notes for performance reviews</p>
                      <p>• Offline document access</p>
                    </div>
                    <div className="space-y-2">
                      <p>• Push notifications for approvals</p>
                      <p>• Quick actions and shortcuts</p>
                      <p>• Dark mode support</p>
                      <p>• Multi-language support</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Download Tab */}
            {activeTab === 'download' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Get Notified When Available</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Be the first to know when the HRStudio360 mobile app launches. 
                    We'll send you a notification with download links.
                  </p>
                  
                  <div className="max-w-md mx-auto">
                    <div className="flex">
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button className="bg-purple-600 text-white px-6 py-3 rounded-r-lg hover:bg-purple-700 transition-colors">
                        Notify Me
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="bg-gray-100 rounded-lg p-8 mb-4">
                      <QrCode className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">QR Code for iOS App</p>
                      <p className="text-sm text-gray-500">Coming Soon</p>
                    </div>
                    <button className="bg-black text-white px-6 py-3 rounded-lg flex items-center mx-auto opacity-50 cursor-not-allowed">
                      <Apple className="h-5 w-5 mr-2" />
                      Download on App Store
                    </button>
                  </div>

                  <div className="text-center">
                    <div className="bg-gray-100 rounded-lg p-8 mb-4">
                      <QrCode className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">QR Code for Android App</p>
                      <p className="text-sm text-gray-500">Coming Soon</p>
                    </div>
                    <button className="bg-green-600 text-white px-6 py-3 rounded-lg flex items-center mx-auto opacity-50 cursor-not-allowed">
                      <Play className="h-5 w-5 mr-2" />
                      Get it on Google Play
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                  <h4 className="font-semibold text-yellow-900 mb-2">Development Timeline</h4>
                  <div className="space-y-2 text-sm text-yellow-800">
                    <p><strong>Q1 2025:</strong> Beta testing begins</p>
                    <p><strong>Q2 2025:</strong> iOS App Store submission</p>
                    <p><strong>Q2 2025:</strong> Google Play Store submission</p>
                    <p><strong>Q3 2025:</strong> Public release</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAppModal;