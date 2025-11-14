import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Briefcase, DollarSign, Clock, Search, Filter, Building2, Users } from 'lucide-react';
import ApplicationFormModal from '../components/modals/ApplicationFormModal';
import Layout from '../components/Layout';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  experienceLevel: string;
  educationLevel: string;
  applicationDeadline: string | null;
  totalApplications: number;
  status: string;
}

export default function CareersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  // Fetch active job postings (public endpoint)
  const { data: jobs = [], isLoading } = useQuery<JobPosting[]>({
    queryKey: ['/api/careers/jobs']
  });

  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || job.department === departmentFilter;
    const matchesEmploymentType = employmentTypeFilter === 'all' || job.employmentType === employmentTypeFilter;
    
    return matchesSearch && matchesDepartment && matchesEmploymentType;
  });

  // Get unique departments and employment types for filters
  const departments = Array.from(new Set(jobs.map(job => job.department))).sort();
  const employmentTypes = Array.from(new Set(jobs.map(job => job.employmentType))).sort();

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Competitive salary';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return 'Competitive salary';
  };

  const handleApplyClick = (job: JobPosting) => {
    setSelectedJob(job);
    setShowApplicationForm(true);
  };

  return (
    <Layout currentView="landing" onNavigate={() => {}} onOpenModal={() => {}}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-careers-title">
                Join Our Team
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto" data-testid="text-careers-subtitle">
                Discover exciting career opportunities and help us build the future of HR technology
              </p>
              <div className="mt-8 flex items-center justify-center gap-6 text-blue-100">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <span data-testid="text-company-name">HRStudio360</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span data-testid="text-open-positions">{jobs.length} Open Positions</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    data-testid="input-job-search"
                  />
                </div>
              </div>
              <div>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  data-testid="select-department-filter"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={employmentTypeFilter}
                  onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  data-testid="select-employment-type-filter"
                >
                  <option value="all">All Types</option>
                  {employmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            {(searchQuery || departmentFilter !== 'all' || employmentTypeFilter !== 'all') && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-results-count">
                  Found {filteredJobs.length} {filteredJobs.length === 1 ? 'position' : 'positions'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDepartmentFilter('all');
                    setEmploymentTypeFilter('all');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Job Listings */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md text-center py-12 px-6">
              <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No positions found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search or filters to find more opportunities
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow p-6"
                  data-testid={`card-job-${job.id}`}
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2" data-testid={`text-job-title-${job.id}`}>
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium" data-testid={`badge-department-${job.id}`}>
                        {job.department}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm" data-testid={`badge-employment-type-${job.id}`}>
                        {job.employmentType}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3" data-testid={`text-job-description-${job.id}`}>
                    {job.description}
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span data-testid={`text-location-${job.id}`}>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span data-testid={`text-salary-${job.id}`}>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span data-testid={`text-experience-${job.id}`}>{job.experienceLevel}</span>
                    </div>
                    {job.applicationDeadline && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span data-testid={`text-deadline-${job.id}`}>
                          Apply by {new Date(job.applicationDeadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t dark:border-gray-700 flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400" data-testid={`text-applicants-${job.id}`}>
                      {job.totalApplications} {job.totalApplications === 1 ? 'applicant' : 'applicants'}
                    </span>
                    <button 
                      onClick={() => handleApplyClick(job)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                      data-testid={`button-apply-${job.id}`}
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && selectedJob && (
        <ApplicationFormModal
          job={selectedJob}
          onClose={() => {
            setShowApplicationForm(false);
            setSelectedJob(null);
          }}
        />
      )}
    </Layout>
  );
}
