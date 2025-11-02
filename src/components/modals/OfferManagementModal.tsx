import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Send, Eye, Download, Plus, CreditCard as Edit3, Save, CheckCircle, AlertTriangle, Calendar, DollarSign, User, Building, Mail, Phone, MapPin, Award, TrendingUp, Users, Clock, Target, Zap, Bell, Star, Heart, Shield, Briefcase, UserPlus } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../../utils/supabaseClient';
import ConfettiAnimation from '../ConfettiAnimation';

interface OfferTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Software Engineer' | 'Product Manager' | 'Sales' | 'Marketing' | 'Executive' | 'Custom';
  content: string;
  benefits: string[];
  salaryRange: {
    min: number;
    max: number;
  };
  isDefault: boolean;
  createdBy: string;
  createdDate: string;
  lastModified: string;
  usageCount: number;
}

interface Offer {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  department: string;
  templateId: string;
  templateName: string;
  salary: number;
  salaryType: 'annual' | 'hourly';
  benefits: string[];
  startDate: string;
  expirationDate: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  createdBy: string;
  createdDate: string;
  sentDate?: string;
  viewedDate?: string;
  responseDate?: string;
  approvalChain: {
    role: string;
    approver: string;
    status: 'pending' | 'approved' | 'rejected';
    date?: string;
    notes?: string;
  }[];
  engagementMetrics: {
    emailOpens: number;
    documentViews: number;
    timeSpentViewing: number;
    lastViewedDate?: string;
    deviceType?: string;
  };
  offerLetter: string;
}

interface OfferManagementModalProps {
  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  position?: string;
  department?: string;
  onClose: () => void;
}

const OfferManagementModal: React.FC<OfferManagementModalProps> = ({
  candidateId = '',
  candidateName = '',
  candidateEmail = '',
  position = '',
  department = '',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('create');
  const [selectedTemplate, setSelectedTemplate] = useState<OfferTemplate | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showOfferDetailsModal, setShowOfferDetailsModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showSendOfferModal, setShowSendOfferModal] = useState(false);
  const [showConvertToNewHireModal, setShowConvertToNewHireModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OfferTemplate | null>(null);
  const offerLetterRef = useRef<HTMLDivElement>(null);

  const [newHireForm, setNewHireForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    manager_id: '',
    start_date: '',
    salary: '',
    employment_type: 'Full-time'
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [offerForm, setOfferForm] = useState({
    candidateName: candidateName || '',
    candidateEmail: candidateEmail || '',
    position: position || '',
    department: department || '',
    salary: '',
    salaryType: 'annual' as 'annual' | 'hourly',
    benefits: [] as string[],
    startDate: '',
    expirationDays: 7,
    templateId: '',
    customContent: ''
  });

  const [offerTemplateForm, setOfferTemplateForm] = useState({
    name: '',
    description: '',
    category: 'Custom' as OfferTemplate['category'],
    content: '',
    benefits: [] as string[],
    salaryMin: '',
    salaryMax: ''
  });

  // Handle ESC key press
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  // Mock offer templates
  const [offerTemplates, setOfferTemplates] = useState<OfferTemplate[]>([
    {
      id: '1',
      name: 'Standard Software Engineer Offer',
      description: 'Comprehensive offer template for software engineering positions',
      category: 'Software Engineer',
      content: `Dear {{candidateName}},

We are pleased to offer you the position of {{position}} at HRStudio360. We believe your skills and experience will be a valuable addition to our {{department}} team.

**Position Details:**
• Position: {{position}}
• Department: {{department}}
• Start Date: {{startDate}}
• Salary: {{salary}}

**Benefits Package:**
{{benefits}}

**Next Steps:**
Please review this offer carefully and respond by {{expirationDate}}. If you have any questions, please don't hesitate to contact us.

We look forward to welcoming you to the HRStudio360 team!

Best regards,
The HRStudio360 Team`,
      benefits: ['Health Insurance', 'Dental Insurance', 'Vision Insurance', '401(k) with Match', 'Flexible PTO', 'Remote Work Options'],
      salaryRange: { min: 80000, max: 150000 },
      isDefault: true,
      createdBy: 'HR Team',
      createdDate: '2024-01-15',
      lastModified: '2025-01-10',
      usageCount: 15
    },
    {
      id: '2',
      name: 'Executive Offer Template',
      description: 'Premium offer template for executive and senior leadership positions',
      category: 'Executive',
      content: `Dear {{candidateName}},

On behalf of HRStudio360, I am delighted to extend an offer for the position of {{position}}. Your exceptional background and leadership experience make you an ideal candidate for our {{department}} team.

**Position Details:**
• Position: {{position}}
• Department: {{department}}
• Start Date: {{startDate}}
• Annual Compensation: {{salary}}

**Executive Benefits Package:**
{{benefits}}

**Additional Executive Perquisites:**
• Stock options and equity participation
• Executive health and wellness program
• Professional development budget ($10,000 annually)
• Flexible work arrangements

This offer is contingent upon successful completion of background checks and reference verification.

Please confirm your acceptance by {{expirationDate}}. I am available to discuss any aspects of this offer.

Sincerely,
Sarah Johnson
CEO, HRStudio360`,
      benefits: ['Premium Health Insurance', 'Executive Dental & Vision', 'Executive Life Insurance', '401(k) with Enhanced Match', 'Unlimited PTO', 'Company Car Allowance', 'Executive Bonus Plan'],
      salaryRange: { min: 150000, max: 300000 },
      isDefault: false,
      createdBy: 'Executive Team',
      createdDate: '2024-06-20',
      lastModified: '2024-12-15',
      usageCount: 3
    },
    {
      id: '3',
      name: 'Sales Representative Offer',
      description: 'Commission-based offer template for sales positions',
      category: 'Sales',
      content: `Dear {{candidateName}},

We are excited to offer you the position of {{position}} with HRStudio360's {{department}} team. Your sales experience and track record align perfectly with our growth objectives.

**Position Details:**
• Position: {{position}}
• Department: {{department}}
• Start Date: {{startDate}}
• Base Salary: {{salary}}
• Commission Structure: Uncapped commission with accelerators

**Sales Benefits Package:**
{{benefits}}

**Sales Incentives:**
• Quarterly bonuses for exceeding targets
• Annual sales trip for top performers
• Car allowance for client meetings
• Flexible schedule for client management

Please respond to this offer by {{expirationDate}}. We're excited about the possibility of you joining our sales team!

Best regards,
Lisa Rodriguez
VP of Sales`,
      benefits: ['Health Insurance', 'Dental Insurance', 'Vision Insurance', '401(k) with Match', 'PTO', 'Commission Plan', 'Car Allowance'],
      salaryRange: { min: 50000, max: 80000 },
      isDefault: false,
      createdBy: 'Sales Team',
      createdDate: '2024-03-10',
      lastModified: '2024-11-22',
      usageCount: 8
    }
  ]);

  // Mock active offers
  const [offers, setOffers] = useState<Offer[]>([
    {
      id: '1',
      candidateId: 'cand-004',
      candidateName: 'Stephan Yarovyi',
      candidateEmail: 'stephan.y@email.com',
      position: 'Data Scientist',
      department: 'Engineering',
      templateId: '1',
      templateName: 'Standard Software Engineer Offer',
      salary: 150000,
      salaryType: 'annual',
      benefits: ['Health Insurance', 'Dental Insurance', 'Vision Insurance', '401(k) with Match', 'Flexible PTO', 'Remote Work Options'],
      startDate: '2025-02-14',
      expirationDate: '2025-01-15',
      status: 'sent',
      createdBy: 'Sarah Johnson',
      createdDate: '2025-01-08T05:30:00Z',
      sentDate: '2025-01-08T10:00:00Z',
      viewedDate: '2025-01-08T14:30:00Z',
      approvalChain: [
        {
          role: 'Hiring Manager',
          approver: 'Sarah Johnson',
          status: 'approved',
          date: '2025-01-08T09:00:00Z'
        },
        {
          role: 'HR Manager',
          approver: 'Emma Wilson',
          status: 'approved',
          date: '2025-01-08T09:30:00Z'
        }
      ],
      engagementMetrics: {
        emailOpens: 3,
        documentViews: 7,
        timeSpentViewing: 25,
        lastViewedDate: '2025-01-10T16:20:00Z',
        deviceType: 'Desktop'
      },
      offerLetter: `Dear Stephan Yarovyi,

We are pleased to offer you the position of Data Scientist at HRStudio360. We believe your skills and experience will be a valuable addition to our Engineering team.

**Position Details:**
• Position: Data Scientist
• Department: Engineering
• Start Date: February 14, 2025
• Annual Salary: $150,000

**Benefits Package:**
• Health Insurance
• Dental Insurance
• Vision Insurance
• 401(k) with Match
• Flexible PTO
• Remote Work Options

**Next Steps:**
Please review this offer carefully and respond by January 15, 2025. If you have any questions, please don't hesitate to contact us.

We look forward to welcoming you to the HRStudio360 team!

Best regards,
The HRStudio360 Team`
    },
    {
      id: '2',
      candidateId: 'cand-005',
      candidateName: 'Karyna Nemyrova',
      candidateEmail: 'karyna.n@email.com',
      position: 'Marketing Manager',
      department: 'Marketing',
      templateId: '3',
      templateName: 'Sales Representative Offer',
      salary: 85000,
      salaryType: 'annual',
      benefits: ['Health Insurance', 'Dental Insurance', 'Vision Insurance', '401(k) with Match', 'PTO', 'Commission Plan'],
      startDate: '2025-02-01',
      expirationDate: '2025-01-20',
      status: 'accepted',
      createdBy: 'Mike Chen',
      createdDate: '2025-01-05T14:20:00Z',
      sentDate: '2025-01-05T16:00:00Z',
      viewedDate: '2025-01-06T09:15:00Z',
      responseDate: '2025-01-07T11:30:00Z',
      approvalChain: [
        {
          role: 'Hiring Manager',
          approver: 'Mike Chen',
          status: 'approved',
          date: '2025-01-05T15:00:00Z'
        },
        {
          role: 'HR Manager',
          approver: 'Emma Wilson',
          status: 'approved',
          date: '2025-01-05T15:30:00Z'
        }
      ],
      engagementMetrics: {
        emailOpens: 5,
        documentViews: 12,
        timeSpentViewing: 45,
        lastViewedDate: '2025-01-07T10:00:00Z',
        deviceType: 'Mobile'
      },
      offerLetter: `Dear Karyna Nemyrova,

We are excited to offer you the position of Marketing Manager with HRStudio360's Marketing team. Your marketing experience and track record align perfectly with our growth objectives.

**Position Details:**
• Position: Marketing Manager
• Department: Marketing
• Start Date: February 1, 2025
• Annual Salary: $85,000

**Benefits Package:**
• Health Insurance
• Dental Insurance
• Vision Insurance
• 401(k) with Match
• PTO
• Commission Plan

We look forward to welcoming you to the HRStudio360 team!

Best regards,
The HRStudio360 Team`
    }
  ]);

  const availableBenefits = [
    'Health Insurance',
    'Dental Insurance',
    'Vision Insurance',
    '401(k) with Match',
    'Flexible PTO',
    'Remote Work Options',
    'Life Insurance',
    'Disability Insurance',
    'Stock Options',
    'Bonus Plan',
    'Car Allowance',
    'Professional Development',
    'Gym Membership',
    'Commuter Benefits'
  ];

  const handleBenefitToggle = (benefit: string) => {
    setOfferForm(prev => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter(b => b !== benefit)
        : [...prev.benefits, benefit]
    }));
  };

  const handleTemplateBenefitToggle = (benefit: string) => {
    setOfferTemplateForm(prev => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter(b => b !== benefit)
        : [...prev.benefits, benefit]
    }));
  };

  const handleCreateOffer = () => {
    if (!offerForm.candidateName || !offerForm.position || !offerForm.salary || !offerForm.startDate || !offerForm.templateId) {
      setNotification({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const template = offerTemplates.find(t => t.id === offerForm.templateId);
    if (!template) return;

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + offerForm.expirationDays);

    // Replace template variables with actual values
    let offerContent = template.content
      .replace(/\{\{candidateName\}\}/g, offerForm.candidateName)
      .replace(/\{\{position\}\}/g, offerForm.position)
      .replace(/\{\{department\}\}/g, offerForm.department)
      .replace(/\{\{startDate\}\}/g, new Date(offerForm.startDate).toLocaleDateString())
      .replace(/\{\{salary\}\}/g, `$${parseInt(offerForm.salary).toLocaleString()} ${offerForm.salaryType}`)
      .replace(/\{\{expirationDate\}\}/g, expirationDate.toLocaleDateString())
      .replace(/\{\{benefits\}\}/g, offerForm.benefits.map(b => `• ${b}`).join('\n'));

    const newOffer: Offer = {
      id: Date.now().toString(),
      candidateId: candidateId || 'new-candidate',
      candidateName: offerForm.candidateName,
      candidateEmail: offerForm.candidateEmail,
      position: offerForm.position,
      department: offerForm.department,
      templateId: offerForm.templateId,
      templateName: template.name,
      salary: parseInt(offerForm.salary),
      salaryType: offerForm.salaryType,
      benefits: offerForm.benefits,
      startDate: offerForm.startDate,
      expirationDate: expirationDate.toISOString().split('T')[0],
      status: 'draft',
      createdBy: 'Current User',
      createdDate: new Date().toISOString(),
      approvalChain: [
        {
          role: 'Hiring Manager',
          approver: 'Current Manager',
          status: 'pending'
        },
        {
          role: 'HR Manager',
          approver: 'Emma Wilson',
          status: 'pending'
        }
      ],
      engagementMetrics: {
        emailOpens: 0,
        documentViews: 0,
        timeSpentViewing: 0
      },
      offerLetter: offerContent
    };

    setOffers(prev => [...prev, newOffer]);

    setNotification({
      type: 'success',
      message: `Offer created for ${offerForm.candidateName}! Sent for approval.`
    });
    setTimeout(() => setNotification(null), 3000);

    // Reset form
    setOfferForm({
      candidateName: candidateName || '',
      candidateEmail: candidateEmail || '',
      position: position || '',
      department: department || '',
      salary: '',
      salaryType: 'annual',
      benefits: [],
      startDate: '',
      expirationDays: 7,
      templateId: '',
      customContent: ''
    });
  };

  const handleCreateTemplate = () => {
    if (!offerTemplateForm.name || !offerTemplateForm.content) {
      setNotification({
        type: 'error',
        message: 'Please fill in template name and content'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const newTemplate: OfferTemplate = {
      id: Date.now().toString(),
      name: offerTemplateForm.name,
      description: offerTemplateForm.description,
      category: offerTemplateForm.category,
      content: offerTemplateForm.content,
      benefits: offerTemplateForm.benefits,
      salaryRange: {
        min: parseInt(offerTemplateForm.salaryMin) || 0,
        max: parseInt(offerTemplateForm.salaryMax) || 0
      },
      isDefault: false,
      createdBy: 'Current User',
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      usageCount: 0
    };

    setOfferTemplates(prev => [...prev, newTemplate]);

    setNotification({
      type: 'success',
      message: 'Offer template created successfully!'
    });
    setTimeout(() => setNotification(null), 3000);

    setShowCreateTemplateModal(false);
    setOfferTemplateForm({
      name: '',
      description: '',
      category: 'Custom',
      content: '',
      benefits: [],
      salaryMin: '',
      salaryMax: ''
    });
  };

  const handleEditTemplate = (template: OfferTemplate) => {
    setEditingTemplate(template);
    setOfferTemplateForm({
      name: template.name,
      description: template.description,
      category: template.category,
      content: template.content,
      benefits: template.benefits,
      salaryMin: template.salaryRange.min.toString(),
      salaryMax: template.salaryRange.max.toString()
    });
    setShowCreateTemplateModal(true);
  };

  const handleDuplicateTemplate = (template: OfferTemplate) => {
    setEditingTemplate(null);
    setOfferTemplateForm({
      name: `${template.name} (Copy)`,
      description: template.description,
      category: template.category,
      content: template.content,
      benefits: template.benefits,
      salaryMin: template.salaryRange.min.toString(),
      salaryMax: template.salaryRange.max.toString()
    });
    setShowCreateTemplateModal(true);
  };

  const handleSaveTemplate = () => {
    if (!offerTemplateForm.name || !offerTemplateForm.content) {
      setNotification({
        type: 'error',
        message: 'Please fill in template name and content'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (editingTemplate) {
      // Update existing template
      setOfferTemplates(prev => prev.map(t =>
        t.id === editingTemplate.id
          ? {
              ...t,
              name: offerTemplateForm.name,
              description: offerTemplateForm.description,
              category: offerTemplateForm.category,
              content: offerTemplateForm.content,
              benefits: offerTemplateForm.benefits,
              salaryRange: {
                min: parseInt(offerTemplateForm.salaryMin) || 0,
                max: parseInt(offerTemplateForm.salaryMax) || 0
              },
              lastModified: new Date().toISOString()
            }
          : t
      ));
      setNotification({
        type: 'success',
        message: 'Template updated successfully!'
      });
    } else {
      // Create new template
      const newTemplate: OfferTemplate = {
        id: Date.now().toString(),
        name: offerTemplateForm.name,
        description: offerTemplateForm.description,
        category: offerTemplateForm.category,
        content: offerTemplateForm.content,
        benefits: offerTemplateForm.benefits,
        salaryRange: {
          min: parseInt(offerTemplateForm.salaryMin) || 0,
          max: parseInt(offerTemplateForm.salaryMax) || 0
        },
        isDefault: false,
        createdBy: 'Current User',
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        usageCount: 0
      };
      setOfferTemplates(prev => [...prev, newTemplate]);
      setNotification({
        type: 'success',
        message: 'Template created successfully!'
      });
    }

    setTimeout(() => setNotification(null), 3000);
    setShowCreateTemplateModal(false);
    setEditingTemplate(null);
    setOfferTemplateForm({
      name: '',
      description: '',
      category: 'Custom',
      content: '',
      benefits: [],
      salaryMin: '',
      salaryMax: ''
    });
  };

  const handleViewOfferDetails = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowOfferDetailsModal(true);
  };

  const handleConvertToNewHire = async () => {
    if (!selectedOffer) return;

    setIsConverting(true);
    try {
      const { data, error } = await supabase.rpc('convert_candidate_to_new_hire', {
        p_candidate_id: selectedOffer.candidateId,
        p_first_name: newHireForm.first_name,
        p_last_name: newHireForm.last_name,
        p_email: newHireForm.email,
        p_phone: newHireForm.phone,
        p_role: newHireForm.role,
        p_department: newHireForm.department,
        p_manager_id: newHireForm.manager_id || null,
        p_start_date: newHireForm.start_date,
        p_salary: parseFloat(newHireForm.salary),
        p_employment_type: newHireForm.employment_type
      });

      if (error) throw error;

      setShowConfetti(true);
      setNotification({
        type: 'success',
        message: 'Candidate successfully converted to new hire! Onboarding tasks have been created.'
      });

      setTimeout(() => {
        setNotification(null);
        setShowConvertToNewHireModal(false);
        setShowOfferDetailsModal(false);
      }, 3000);
    } catch (error) {
      console.error('Error converting to new hire:', error);
      setNotification({
        type: 'error',
        message: 'Failed to convert candidate to new hire. Please try again.'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadOfferPDF = async (offer: Offer) => {
    if (!offerLetterRef.current) {
      setNotification({
        type: 'error',
        message: 'Offer letter content not found. Please try again.'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // Create a temporary div with the offer letter content
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      tempDiv.style.padding = '40px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '14px';
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.color = '#333';

      // Add company header
      tempDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0; font-weight: bold;">HRStudio360</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 16px;">AI-Powered HR Solutions</p>
        </div>
        <div style="white-space: pre-line; margin-bottom: 40px;">
          ${offer.offerLetter}
        </div>
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>HRStudio360 • 123 Business Ave, Amherst, NH 03031 • 1-800-HR-STUDIO</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      `;

      document.body.appendChild(tempDiv);

      // Generate canvas from the temporary div
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Download the PDF
      const filename = `Offer_Letter_${offer.candidateName.replace(/\s+/g, '_')}_${offer.position.replace(/\s+/g, '_')}.pdf`;
      pdf.save(filename);

      setNotification({
        type: 'success',
        message: 'Offer letter PDF downloaded successfully!'
      });
      setTimeout(() => setNotification(null), 3000);

    } catch (error) {
      console.error('Error generating PDF:', error);
      setNotification({
        type: 'error',
        message: 'Failed to generate PDF. Please try again.'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendOffer = (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;

    setOffers(prev => prev.map(o => 
      o.id === offerId 
        ? { 
            ...o, 
            status: 'sent' as const,
            sentDate: new Date().toISOString()
          }
        : o
    ));

    console.log('Sending offer email:', {
      to: offer.candidateEmail,
      subject: `Job Offer - ${offer.position} at HRStudio360`,
      message: `Dear ${offer.candidateName}, please find your job offer attached.`,
      attachment: 'offer-letter.pdf'
    });

    setNotification({
      type: 'success',
      message: `Offer sent to ${offer.candidateName}!`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-purple-100 text-purple-800';
      case 'viewed': return 'bg-indigo-100 text-indigo-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Software Engineer': return 'bg-blue-100 text-blue-800';
      case 'Product Manager': return 'bg-purple-100 text-purple-800';
      case 'Sales': return 'bg-green-100 text-green-800';
      case 'Marketing': return 'bg-yellow-100 text-yellow-800';
      case 'Executive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'create', label: 'Create Offer', icon: Plus },
    { id: 'active', label: 'Active Offers', count: offers.length },
    { id: 'templates', label: 'Templates', count: offerTemplates.length },
    { id: 'analytics', label: 'Analytics' }
  ];

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-7xl h-[90vh] overflow-auto shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
            <div className="flex items-center">
              <FileText className="h-8 w-8 mr-3" />
              <div>
                <h2 className="text-2xl font-bold">Offer Management</h2>
                <p className="text-emerald-100">Comprehensive offer letter management system</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-emerald-100 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon || FileText;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label} {tab.count !== undefined && `(${tab.count})`}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="overflow-y-auto max-h-96">
          <div className="p-6">
            {/* Create Offer Tab */}
            {activeTab === 'create' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Create New Offer</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Candidate Name *</label>
                    <input
                      type="text"
                      value={offerForm.candidateName}
                      onChange={(e) => setOfferForm({ ...offerForm, candidateName: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter candidate name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={offerForm.candidateEmail}
                      onChange={(e) => setOfferForm({ ...offerForm, candidateEmail: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="candidate@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Position *</label>
                    <input
                      type="text"
                      value={offerForm.position}
                      onChange={(e) => setOfferForm({ ...offerForm, position: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Department *</label>
                    <select
                      value={offerForm.department}
                      onChange={(e) => setOfferForm({ ...offerForm, department: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Select Department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Salary *</label>
                    <input
                      type="number"
                      value={offerForm.salary}
                      onChange={(e) => setOfferForm({ ...offerForm, salary: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="150000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Salary Type</label>
                    <select
                      value={offerForm.salaryType}
                      onChange={(e) => setOfferForm({ ...offerForm, salaryType: e.target.value as 'annual' | 'hourly' })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="annual">Annual</option>
                      <option value="hourly">Hourly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Start Date *</label>
                    <input
                      type="date"
                      value={offerForm.startDate}
                      onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Offer Template *</label>
                  <select
                    value={offerForm.templateId}
                    onChange={(e) => setOfferForm({ ...offerForm, templateId: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select Template</option>
                    {offerTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3">Benefits Package</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableBenefits.map(benefit => (
                      <label key={benefit} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={offerForm.benefits.includes(benefit)}
                          onChange={() => handleBenefitToggle(benefit)}
                          className="mr-2 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{benefit}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleCreateOffer}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Offer
                  </button>
                </div>
              </div>
            )}

            {/* Active Offers Tab */}
            {activeTab === 'active' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Active Offers</h3>
                
                <div className="grid gap-6">
                  {offers.map((offer) => (
                    <div key={offer.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">{offer.candidateName}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                              {offer.status.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <div>
                              <span className="font-medium">Position:</span> {offer.position}
                            </div>
                            <div>
                              <span className="font-medium">Department:</span> {offer.department}
                            </div>
                            <div>
                              <span className="font-medium">Salary:</span> ${offer.salary.toLocaleString()} {offer.salaryType}
                            </div>
                            <div>
                              <span className="font-medium">Start Date:</span> {new Date(offer.startDate).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Engagement Metrics */}
                          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border">
                            <h5 className="font-medium text-gray-900 dark:text-white dark:text-white mb-2">Engagement Metrics</h5>
                            <div className="grid grid-cols-4 gap-4 text-center">
                              <div>
                                <p className="text-2xl font-bold text-blue-600">{offer.engagementMetrics.emailOpens}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Email Opens</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-green-600">{offer.engagementMetrics.documentViews}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Document Views</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-purple-600">{offer.engagementMetrics.timeSpentViewing}m</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Time Viewing</p>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-orange-600">{offer.engagementMetrics.deviceType || 'Unknown'}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Device</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewOfferDetails(offer)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </button>
                          <button
                            onClick={() => handleDownloadOfferPDF(offer)}
                            disabled={isGeneratingPDF}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center disabled:opacity-50"
                          >
                            {isGeneratingPDF ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </>
                            )}
                          </button>
                          {offer.status === 'approved' && (
                            <button
                              onClick={() => handleSendOffer(offer.id)}
                              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send Offer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {offers.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No offers created yet</p>
                      <button
                        onClick={() => setActiveTab('create')}
                        className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Create First Offer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Offer Templates</h3>
                  <button
                    onClick={() => setShowCreateTemplateModal(true)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </button>
                </div>

                <div className="grid gap-6">
                  {offerTemplates.map((template) => (
                    <div key={template.id} className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">{template.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                              {template.category}
                            </span>
                            {template.isDefault && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">{template.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                            <div>
                              <span className="font-medium">Salary Range:</span> ${template.salaryRange.min.toLocaleString()} - ${template.salaryRange.max.toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Benefits:</span> {template.benefits.length} included
                            </div>
                            <div>
                              <span className="font-medium">Usage:</span> {template.usageCount} times
                            </div>
                            <div>
                              <span className="font-medium">Modified:</span> {new Date(template.lastModified).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDuplicateTemplate(template)}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                          >
                            Duplicate
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Offer Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Total Offers</h4>
                    <p className="text-3xl font-bold text-blue-600">{offers.length}</p>
                    <p className="text-blue-700 text-sm">This month</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-green-900 mb-2">Acceptance Rate</h4>
                    <p className="text-3xl font-bold text-green-600">
                      {offers.length > 0 ? Math.round((offers.filter(o => o.status === 'accepted').length / offers.length) * 100) : 0}%
                    </p>
                    <p className="text-green-700 text-sm">Above industry avg</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-purple-900 mb-2">Avg Response Time</h4>
                    <p className="text-3xl font-bold text-purple-600">3.2</p>
                    <p className="text-purple-700 text-sm">Days</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-yellow-900 mb-2">Template Usage</h4>
                    <p className="text-3xl font-bold text-yellow-600">
                      {offerTemplates.reduce((sum, t) => sum + t.usageCount, 0)}
                    </p>
                    <p className="text-yellow-700 text-sm">Total uses</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Recent Activity</h4>
                  <div className="space-y-3">
                    {offers.slice(0, 5).map((offer) => (
                      <div key={offer.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            offer.status === 'accepted' ? 'bg-green-100' :
                            offer.status === 'sent' ? 'bg-blue-100' :
                            'bg-gray-100'
                          }`}>
                            <FileText className={`h-4 w-4 ${
                              offer.status === 'accepted' ? 'text-green-600' :
                              offer.status === 'sent' ? 'text-blue-600' :
                              'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white dark:text-white">{offer.candidateName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{offer.position} • {offer.status.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(offer.createdDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Offer Details Modal - Fixed z-index and visibility */}
      {showOfferDetailsModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
              <div>
                <h3 className="text-xl font-bold">Offer Details - {selectedOffer.candidateName}</h3>
                <p className="text-emerald-100">{selectedOffer.position} • {selectedOffer.department}</p>
              </div>
              <button
                onClick={() => setShowOfferDetailsModal(false)}
                className="text-emerald-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Offer Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Compensation</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    ${selectedOffer.salary.toLocaleString()}
                  </p>
                  <p className="text-blue-700 text-sm">{selectedOffer.salaryType}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Start Date</h4>
                  <p className="text-lg font-bold text-green-600">
                    {new Date(selectedOffer.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">Expires</h4>
                  <p className="text-lg font-bold text-purple-600">
                    {new Date(selectedOffer.expirationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Approval Status */}
              <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Approval Status</h4>
                <div className="space-y-3">
                  {selectedOffer.approvalChain.map((approval, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          approval.status === 'approved' ? 'bg-green-100' :
                          approval.status === 'rejected' ? 'bg-red-100' :
                          'bg-yellow-100'
                        }`}>
                          {approval.status === 'approved' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : approval.status === 'rejected' ? (
                            <X className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white dark:text-white">{approval.role}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{approval.approver}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          approval.status === 'approved' ? 'bg-green-100 text-green-800' :
                          approval.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {approval.status}
                        </span>
                        {approval.date && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(approval.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Offer Letter Content */}
              <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Offer Letter</h4>
                <div 
                  ref={offerLetterRef}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border-2 border-dashed border-gray-300 dark:border-gray-600"
                  style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6' }}
                >
                  <div className="text-center mb-6 pb-4 border-b-2 border-emerald-600">
                    <h1 className="text-2xl font-bold text-emerald-600 mb-2">HRStudio360</h1>
                    <p className="text-gray-600 dark:text-gray-400">AI-Powered HR Solutions</p>
                  </div>
                  
                  <div className="whitespace-pre-line text-gray-800 mb-6">
                    {selectedOffer.offerLetter}
                  </div>
                  
                  <div className="border-t pt-4 text-center text-gray-500 text-sm">
                    <p>HRStudio360 • 123 Business Ave, Amherst, NH 03031 • 1-800-HR-STUDIO</p>
                    <p>Generated on {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-6 border-t bg-gray-50 dark:bg-gray-900">
              <div>
                {selectedOffer.status === 'accepted' && (
                  <button
                    onClick={() => {
                      setNewHireForm({
                        first_name: selectedOffer.candidateName.split(' ')[0] || '',
                        last_name: selectedOffer.candidateName.split(' ').slice(1).join(' ') || '',
                        email: selectedOffer.candidateEmail,
                        phone: '',
                        role: selectedOffer.position,
                        department: selectedOffer.department,
                        manager_id: '',
                        start_date: selectedOffer.startDate,
                        salary: selectedOffer.salary.toString(),
                        employment_type: 'Full-time'
                      });
                      setShowConvertToNewHireModal(true);
                    }}
                    className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Convert to New Hire
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowOfferDetailsModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadOfferPDF(selectedOffer)}
                  disabled={isGeneratingPDF}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center disabled:opacity-50"
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateTemplateModal && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 999999
          }}
          onClick={() => {
            setShowCreateTemplateModal(false);
            setEditingTemplate(null);
            setOfferTemplateForm({
              name: '',
              description: '',
              category: 'Custom',
              content: '',
              benefits: [],
              salaryMin: '',
              salaryMax: ''
            });
          }}
        >
          <div
            className="relative bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl w-full shadow-2xl border-4 border-emerald-500"
            style={{ maxWidth: '56rem', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b bg-gradient-to-r from-emerald-600 to-blue-600">
              <h3 className="text-xl font-bold text-white">
                {editingTemplate ? 'Edit Offer Template' : 'Create Offer Template'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateTemplateModal(false);
                  setEditingTemplate(null);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 bg-white dark:bg-gray-800 dark:bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Template Name *</label>
                  <input
                    type="text"
                    value={offerTemplateForm.name}
                    onChange={(e) => setOfferTemplateForm({ ...offerTemplateForm, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="e.g., Senior Developer Offer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Category</label>
                  <select
                    value={offerTemplateForm.category}
                    onChange={(e) => setOfferTemplateForm({ ...offerTemplateForm, category: e.target.value as OfferTemplate['category'] })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="Custom">Custom</option>
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Description</label>
                <input
                  type="text"
                  value={offerTemplateForm.description}
                  onChange={(e) => setOfferTemplateForm({ ...offerTemplateForm, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Brief description of this template"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3">Default Benefits</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableBenefits.map(benefit => (
                    <label key={benefit} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={offerTemplateForm.benefits.includes(benefit)}
                        onChange={() => handleTemplateBenefitToggle(benefit)}
                        className="mr-2 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{benefit}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Template Content *</label>
                <textarea
                  value={offerTemplateForm.content}
                  onChange={(e) => setOfferTemplateForm({ ...offerTemplateForm, content: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={12}
                  placeholder="Use variables like {{candidateName}}, {{position}}, {{department}}, {{salary}}, {{startDate}}, {{benefits}}, {{expirationDate}}"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Available Variables</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-800">
                  <span>{{candidateName}}</span>
                  <span>{{position}}</span>
                  <span>{{department}}</span>
                  <span>{{salary}}</span>
                  <span>{{startDate}}</span>
                  <span>{{benefits}}</span>
                  <span>{{expirationDate}}</span>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end space-x-3 p-6 border-t bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => {
                  setShowCreateTemplateModal(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[10000] flex items-center text-white ${
          notification.type === 'success' ? 'bg-green-600' :
          notification.type === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          <div className={`rounded-full p-1 mr-3 ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : notification.type === 'error' ? (
              <X className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
          </div>
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification(null)} 
            className="ml-3 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Convert to New Hire Modal */}
      {showConvertToNewHireModal && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 999999
          }}
        >
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserPlus className="h-8 w-8" />
                <div>
                  <h3 className="text-xl font-bold">Convert to New Hire</h3>
                  <p className="text-teal-100 text-sm">Create new hire record and start onboarding</p>
                </div>
              </div>
              <button
                onClick={() => setShowConvertToNewHireModal(false)}
                className="text-white hover:bg-white dark:bg-gray-800 dark:bg-gray-800 hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-teal-900">Offer Accepted!</p>
                    <p className="text-sm text-teal-700 mt-1">
                      Converting this candidate to a new hire will automatically:
                    </p>
                    <ul className="text-sm text-teal-700 mt-2 space-y-1 ml-4 list-disc">
                      <li>Create a new hire record</li>
                      <li>Generate role-based onboarding tasks</li>
                      <li>Assign tasks to new hire, manager, IT, and other departments</li>
                      <li>Send notifications to relevant stakeholders</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newHireForm.first_name}
                    onChange={(e) => setNewHireForm({ ...newHireForm, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={newHireForm.last_name}
                    onChange={(e) => setNewHireForm({ ...newHireForm, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newHireForm.email}
                  onChange={(e) => setNewHireForm({ ...newHireForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newHireForm.phone}
                  onChange={(e) => setNewHireForm({ ...newHireForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Role *
                  </label>
                  <input
                    type="text"
                    value={newHireForm.role}
                    onChange={(e) => setNewHireForm({ ...newHireForm, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Department *
                  </label>
                  <input
                    type="text"
                    value={newHireForm.department}
                    onChange={(e) => setNewHireForm({ ...newHireForm, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newHireForm.start_date}
                    onChange={(e) => setNewHireForm({ ...newHireForm, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                    Salary *
                  </label>
                  <input
                    type="number"
                    value={newHireForm.salary}
                    onChange={(e) => setNewHireForm({ ...newHireForm, salary: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Employment Type *
                </label>
                <select
                  value={newHireForm.employment_type}
                  onChange={(e) => setNewHireForm({ ...newHireForm, employment_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setShowConvertToNewHireModal(false)}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConvertToNewHire}
                disabled={isConverting || !newHireForm.first_name || !newHireForm.last_name || !newHireForm.email || !newHireForm.start_date || !newHireForm.salary}
                className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConverting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Converting...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Convert to New Hire
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confetti Animation */}
      <ConfettiAnimation
        show={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </>,
    document.body
  );
};

export default OfferManagementModal;