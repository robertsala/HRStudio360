import React from 'react';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Contact: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section id="contact" className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('contact.title')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('contact.subtitle')}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900 dark:text-white">{t('contact.emailUs')}</div>
                  <div className="text-gray-600 dark:text-gray-400">contact@hrstudio360.com</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <Phone className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900 dark:text-white">{t('contact.callUs')}</div>
                  <div className="text-gray-600 dark:text-gray-400">1-800-HR-STUDIO</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900 dark:text-white">{t('contact.visitUs')}</div>
                  <div className="text-gray-600 dark:text-gray-400">Amherst, NH</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 lg:mt-0">
            <div className="bg-gradient-to-br from-blue-600 to-emerald-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6 text-center">{t('contact.requestDemo')}</h3>
              <form 
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    company: formData.get('company'),
                    employees: formData.get('employees'),
                    challenges: formData.get('challenges')
                  };
                  
                  console.log('Demo request submitted:', data);
                  
                  // Show success message
                  const successDiv = document.createElement('div');
                  successDiv.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center';
                  successDiv.innerHTML = `
                    <div class="bg-green-500 rounded-full p-1 mr-3">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span>${t('contact.thankYouMessage')}</span>
                  `;
                  document.body.appendChild(successDiv);
                  
                  // Remove success message after 5 seconds
                  setTimeout(() => {
                    document.body.removeChild(successDiv);
                  }, 5000);
                  
                  e.currentTarget.reset();
                }}
              >
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder={t('contact.fullName')}
                    required
                    className="w-full p-3 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder={t('contact.workEmail')}
                    required
                    className="w-full p-3 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="company"
                    placeholder={t('contact.companyName')}
                    required
                    className="w-full p-3 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="employees"
                    placeholder={t('contact.numberOfEmployees')}
                    required
                    className="w-full p-3 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>
                <div>
                  <textarea
                    name="challenges"
                    placeholder={t('contact.tellUsChallenges')}
                    rows={4}
                    className="w-full p-3 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white resize-none"
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-white dark:bg-gray-800 text-blue-600 p-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                  {t('contact.scheduleDemo')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;