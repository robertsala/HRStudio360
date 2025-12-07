import { db } from './db';
import { 
  complianceFrameworks, 
  complianceControls, 
  complianceAlerts, 
  complianceAuditTrail,
  compliancePolicies,
  profiles
} from '../shared/schema';
import { eq } from 'drizzle-orm';

export async function seedComplianceData() {
  console.log('[Compliance Seed] Starting compliance demo data seeding...');

  try {
    // Check if the table exists by attempting a simple query
    // If it fails, tables haven't been migrated yet - skip silently
    let existingFrameworks;
    try {
      existingFrameworks = await db.select().from(complianceFrameworks).limit(1);
    } catch (tableError: any) {
      // Drizzle wraps PostgreSQL errors - check both the error itself and its cause
      const errorMessage = tableError?.message || '';
      const causeMessage = tableError?.cause?.message || '';
      const errorCode = tableError?.code || tableError?.cause?.code || '';
      
      // PostgreSQL error code 42P01 = undefined_table
      const isTableMissing = 
        errorCode === '42P01' ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('relation') ||
        causeMessage.includes('does not exist') ||
        causeMessage.includes('relation');
      
      if (isTableMissing) {
        console.log('[Compliance Seed] Compliance tables not yet created, skipping seed (run migrations first)');
        return;
      }
      
      // Log the full error for debugging but don't crash
      console.error('[Compliance Seed] Unexpected error checking table existence:', {
        message: errorMessage,
        causeMessage,
        code: errorCode
      });
      return;
    }
    
    if (existingFrameworks.length > 0) {
      console.log('[Compliance Seed] Compliance data already exists, skipping seed');
      return;
    }

    const adminProfiles = await db.select().from(profiles).where(
      eq(profiles.department, 'HR')
    ).limit(1);
    const adminId = adminProfiles[0]?.id || null;

    const [soc2] = await db.insert(complianceFrameworks).values({
      name: 'SOC 2 Type II',
      code: 'SOC2',
      description: 'Service Organization Control 2 - Security, Availability, Processing Integrity, Confidentiality, and Privacy',
      version: '2024',
      isActive: true,
      complianceScore: 87,
      totalControls: 42,
      compliantControls: 37,
      lastAuditDate: new Date('2024-11-15'),
      nextAuditDate: new Date('2025-11-15'),
      certificationExpiry: new Date('2025-12-31'),
      overallStatus: 'compliant'
    }).returning();

    const [gdpr] = await db.insert(complianceFrameworks).values({
      name: 'GDPR',
      code: 'GDPR',
      description: 'General Data Protection Regulation - EU data privacy and protection law',
      version: '2024',
      isActive: true,
      complianceScore: 92,
      totalControls: 28,
      compliantControls: 26,
      lastAuditDate: new Date('2024-09-20'),
      nextAuditDate: new Date('2025-09-20'),
      overallStatus: 'compliant'
    }).returning();

    const [hipaa] = await db.insert(complianceFrameworks).values({
      name: 'HIPAA',
      code: 'HIPAA',
      description: 'Health Insurance Portability and Accountability Act - Healthcare data protection',
      version: '2024',
      isActive: true,
      complianceScore: 78,
      totalControls: 35,
      compliantControls: 27,
      lastAuditDate: new Date('2024-08-10'),
      nextAuditDate: new Date('2025-08-10'),
      certificationExpiry: new Date('2025-08-31'),
      overallStatus: 'partial'
    }).returning();

    const [iso27001] = await db.insert(complianceFrameworks).values({
      name: 'ISO 27001',
      code: 'ISO27001',
      description: 'Information Security Management System - International security standard',
      version: '2022',
      isActive: true,
      complianceScore: 94,
      totalControls: 54,
      compliantControls: 51,
      lastAuditDate: new Date('2024-06-05'),
      nextAuditDate: new Date('2025-06-05'),
      certificationExpiry: new Date('2026-06-30'),
      overallStatus: 'compliant'
    }).returning();

    console.log('[Compliance Seed] Created 4 compliance frameworks');

    const controlsData: Array<{
      frameworkId: string;
      controlId: string;
      name: string;
      description: string;
      status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable' | 'pending_review';
      priority: number;
      category: string;
      riskLevel: string;
    }> = [
      { frameworkId: soc2.id, controlId: 'CC6.1', name: 'Access Control Management', description: 'Implement role-based access controls', status: 'compliant', priority: 1, category: 'Security', riskLevel: 'high' },
      { frameworkId: soc2.id, controlId: 'CC6.2', name: 'Data Encryption at Rest', description: 'Encrypt all sensitive data at rest', status: 'compliant', priority: 1, category: 'Security', riskLevel: 'high' },
      { frameworkId: soc2.id, controlId: 'CC7.1', name: 'Incident Response Plan', description: 'Maintain documented incident response procedures', status: 'compliant', priority: 2, category: 'Operations', riskLevel: 'high' },
      { frameworkId: soc2.id, controlId: 'CC9.1', name: 'Vendor Risk Assessment', description: 'Assess and monitor third-party vendor risks', status: 'non_compliant', priority: 3, category: 'Risk Management', riskLevel: 'medium' },
      { frameworkId: soc2.id, controlId: 'CC8.1', name: 'Change Management', description: 'Document and approve all system changes', status: 'compliant', priority: 2, category: 'Operations', riskLevel: 'high' },
      { frameworkId: gdpr.id, controlId: 'GDPR-15', name: 'Data Subject Rights', description: 'Enable data subject access and deletion requests', status: 'compliant', priority: 1, category: 'Privacy', riskLevel: 'high' },
      { frameworkId: gdpr.id, controlId: 'GDPR-35', name: 'Privacy Impact Assessment', description: 'Conduct PIAs for new data processing activities', status: 'compliant', priority: 2, category: 'Privacy', riskLevel: 'high' },
      { frameworkId: gdpr.id, controlId: 'GDPR-28', name: 'Data Processing Agreements', description: 'Maintain DPAs with all data processors', status: 'partial', priority: 2, category: 'Legal', riskLevel: 'high' },
      { frameworkId: gdpr.id, controlId: 'GDPR-7', name: 'Consent Management', description: 'Obtain and track user consent for data processing', status: 'compliant', priority: 1, category: 'Privacy', riskLevel: 'high' },
      { frameworkId: hipaa.id, controlId: 'HIPAA-164.312', name: 'PHI Access Logging', description: 'Log all access to protected health information', status: 'compliant', priority: 1, category: 'Security', riskLevel: 'high' },
      { frameworkId: hipaa.id, controlId: 'HIPAA-164.530', name: 'Employee Training', description: 'Annual HIPAA training for all staff', status: 'non_compliant', priority: 2, category: 'Training', riskLevel: 'high' },
      { frameworkId: hipaa.id, controlId: 'HIPAA-164.314', name: 'Business Associate Agreements', description: 'BAAs with all vendors handling PHI', status: 'partial', priority: 1, category: 'Legal', riskLevel: 'high' },
      { frameworkId: hipaa.id, controlId: 'HIPAA-164.404', name: 'Breach Notification', description: 'Procedures for breach notification within 60 days', status: 'compliant', priority: 1, category: 'Operations', riskLevel: 'high' },
      { frameworkId: iso27001.id, controlId: 'A.5.1', name: 'Information Security Policy', description: 'Documented and approved security policies', status: 'compliant', priority: 1, category: 'Governance', riskLevel: 'high' },
      { frameworkId: iso27001.id, controlId: 'A.6.1', name: 'Risk Assessment', description: 'Annual information security risk assessment', status: 'compliant', priority: 2, category: 'Risk Management', riskLevel: 'high' },
      { frameworkId: iso27001.id, controlId: 'A.8.1', name: 'Asset Management', description: 'Inventory and classification of information assets', status: 'compliant', priority: 3, category: 'Operations', riskLevel: 'medium' },
      { frameworkId: iso27001.id, controlId: 'A.10.1', name: 'Cryptographic Controls', description: 'Appropriate use of encryption and key management', status: 'compliant', priority: 2, category: 'Security', riskLevel: 'high' },
    ];

    await db.insert(complianceControls).values(controlsData);
    console.log('[Compliance Seed] Created 17 compliance controls');

    const alertsData = [
      {
        title: 'HIPAA Training Overdue',
        description: '15 employees have not completed mandatory HIPAA training. Training was due 30 days ago.',
        severity: 'critical' as const,
        status: 'open' as const,
        frameworkId: hipaa.id,
        category: 'training',
        sourceModule: 'training',
        requiresAction: true,
        automatedAlert: true
      },
      {
        title: 'Vendor Security Assessment Required',
        description: 'Annual security assessment for CloudStorage Inc. is due in 14 days.',
        severity: 'high' as const,
        status: 'open' as const,
        frameworkId: soc2.id,
        category: 'deadline',
        sourceModule: 'security',
        requiresAction: true,
        automatedAlert: true,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Data Processing Agreement Update',
        description: 'DPA with PayrollPro needs to be updated to include new data categories.',
        severity: 'medium' as const,
        status: 'acknowledged' as const,
        frameworkId: gdpr.id,
        category: 'regulatory_update',
        sourceModule: 'onboarding',
        requiresAction: true,
        automatedAlert: false,
        acknowledgedAt: new Date(),
        acknowledgedById: adminId
      },
      {
        title: 'ISO 27001 Audit Preparation',
        description: 'External audit scheduled in 90 days. Begin evidence collection.',
        severity: 'low' as const,
        status: 'open' as const,
        frameworkId: iso27001.id,
        category: 'audit_finding',
        sourceModule: 'security',
        requiresAction: true,
        automatedAlert: true,
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Password Policy Compliance',
        description: '3 users have passwords older than 90 days.',
        severity: 'medium' as const,
        status: 'resolved' as const,
        frameworkId: soc2.id,
        category: 'violation',
        sourceModule: 'security',
        requiresAction: false,
        automatedAlert: true,
        resolvedAt: new Date(),
        resolvedById: adminId,
        resolutionNotes: 'Automated password reset enforced for affected users.'
      },
      {
        title: 'New GDPR Guidance Published',
        description: 'European Data Protection Board published new guidance on AI-based profiling.',
        severity: 'info' as const,
        status: 'open' as const,
        frameworkId: gdpr.id,
        category: 'regulatory_update',
        sourceModule: 'security',
        requiresAction: false,
        automatedAlert: true
      }
    ];

    await db.insert(complianceAlerts).values(alertsData);
    console.log('[Compliance Seed] Created 6 compliance alerts');

    const auditTrailData = [
      {
        eventType: 'create',
        category: 'onboarding' as const,
        action: 'new_hire_created',
        resourceType: 'employee',
        resourceId: 'emp-001',
        resourceName: 'John Smith',
        actorEmail: 'hr@company.com',
        actorRole: 'HR Manager',
        actorIpAddress: '192.168.1.100',
        actorUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        changeDescription: 'New hire John Smith onboarded to Engineering department',
        moduleSource: 'onboarding',
        success: true
      },
      {
        eventType: 'update',
        category: 'security' as const,
        action: 'permission_changed',
        resourceType: 'permission',
        resourceId: 'perm-002',
        resourceName: 'Admin Access',
        actorEmail: 'admin@company.com',
        actorRole: 'Product Owner',
        actorIpAddress: '192.168.1.50',
        actorUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        changeDescription: 'Elevated permissions granted to Sarah Johnson',
        moduleSource: 'security',
        success: true,
        isSensitive: true
      },
      {
        eventType: 'create',
        category: 'payroll' as const,
        action: 'payroll_processed',
        resourceType: 'payroll',
        resourceId: 'pay-2024-12',
        resourceName: 'December 2024 Payroll',
        actorEmail: 'payroll@company.com',
        actorRole: 'Payroll Administrator',
        actorIpAddress: '192.168.1.75',
        actorUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        changeDescription: 'Monthly payroll processed for 247 employees',
        moduleSource: 'payroll',
        success: true
      },
      {
        eventType: 'update',
        category: 'performance' as const,
        action: 'training_completed',
        resourceType: 'training',
        resourceId: 'train-hipaa-001',
        resourceName: 'HIPAA Annual Training',
        actorEmail: 'mike.chen@company.com',
        actorRole: 'Employee',
        actorIpAddress: '10.0.0.45',
        actorUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
        changeDescription: 'HIPAA compliance training completed with score 95%',
        moduleSource: 'training',
        success: true
      },
      {
        eventType: 'delete',
        category: 'offboarding' as const,
        action: 'access_revoked',
        resourceType: 'access',
        resourceId: 'acc-003',
        resourceName: 'System Access',
        actorEmail: 'security@company.com',
        actorRole: 'Security Officer',
        actorIpAddress: '192.168.1.10',
        actorUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        changeDescription: 'Access revoked for terminated employee Jane Doe',
        moduleSource: 'security',
        success: true,
        isSensitive: true
      },
      {
        eventType: 'create',
        category: 'onboarding' as const,
        action: 'i9_completed',
        resourceType: 'document',
        resourceId: 'i9-2024-089',
        resourceName: 'I-9 Form',
        actorEmail: 'hr@company.com',
        actorRole: 'HR Specialist',
        actorIpAddress: '192.168.1.100',
        actorUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        changeDescription: 'I-9 verification completed for new hire',
        moduleSource: 'onboarding',
        success: true
      },
      {
        eventType: 'update',
        category: 'payroll' as const,
        action: 'tax_form_updated',
        resourceType: 'tax_form',
        resourceId: 'w4-emp-156',
        resourceName: 'W-4 Form',
        actorEmail: 'employee156@company.com',
        actorRole: 'Employee',
        actorIpAddress: '10.0.0.88',
        actorUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        changeDescription: 'Employee updated tax withholding elections',
        moduleSource: 'payroll',
        success: true
      },
      {
        eventType: 'read',
        category: 'data_access' as const,
        action: 'sensitive_data_accessed',
        resourceType: 'employee_record',
        resourceId: 'emp-042',
        resourceName: 'Employee SSN',
        actorEmail: 'payroll@company.com',
        actorRole: 'Payroll Administrator',
        actorIpAddress: '192.168.1.75',
        actorUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        changeDescription: 'SSN accessed for payroll processing',
        moduleSource: 'payroll',
        success: true,
        isSensitive: true,
        riskScore: 45
      }
    ];

    await db.insert(complianceAuditTrail).values(auditTrailData);
    console.log('[Compliance Seed] Created 8 audit trail entries');

    const policiesData = [
      {
        title: 'Information Security Policy',
        description: 'Comprehensive information security policy covering data protection, access controls, and incident response.',
        content: '# Information Security Policy\n\n## Purpose\nThis policy establishes the framework for protecting company information assets...',
        version: '3.2',
        category: 'security',
        frameworkId: iso27001.id,
        effectiveDate: new Date('2024-01-01'),
        reviewFrequencyDays: 365,
        nextReviewDate: new Date('2025-01-01'),
        ownerId: adminId,
        requiresAcknowledgment: true,
        isActive: true
      },
      {
        title: 'Data Privacy Policy',
        description: 'Policy governing the collection, use, and protection of personal data in compliance with GDPR.',
        content: '# Data Privacy Policy\n\n## Scope\nThis policy applies to all personal data processed by the organization...',
        version: '2.1',
        category: 'privacy',
        frameworkId: gdpr.id,
        effectiveDate: new Date('2024-03-15'),
        reviewFrequencyDays: 180,
        nextReviewDate: new Date('2025-03-15'),
        ownerId: adminId,
        requiresAcknowledgment: true,
        isActive: true
      },
      {
        title: 'Acceptable Use Policy',
        description: 'Guidelines for appropriate use of company technology resources and systems.',
        content: '# Acceptable Use Policy\n\n## Overview\nThis policy defines acceptable use of company IT resources...',
        version: '4.0',
        category: 'hr',
        effectiveDate: new Date('2024-06-01'),
        reviewFrequencyDays: 365,
        nextReviewDate: new Date('2025-06-01'),
        ownerId: adminId,
        requiresAcknowledgment: true,
        isActive: true
      },
      {
        title: 'HIPAA Privacy Practices',
        description: 'Notice of privacy practices for protected health information.',
        content: '# Notice of Privacy Practices\n\n## Your Rights\nThis notice describes how medical information may be used...',
        version: '1.5',
        category: 'healthcare',
        frameworkId: hipaa.id,
        effectiveDate: new Date('2024-01-15'),
        reviewFrequencyDays: 365,
        nextReviewDate: new Date('2025-01-15'),
        ownerId: adminId,
        requiresAcknowledgment: true,
        isActive: true
      },
      {
        title: 'Incident Response Procedure',
        description: 'Procedures for responding to and reporting security incidents.',
        content: '# Incident Response Procedure\n\n## Detection\nSecurity incidents may be detected through various means...',
        version: '2.3',
        category: 'security',
        frameworkId: soc2.id,
        effectiveDate: new Date('2024-04-01'),
        reviewFrequencyDays: 180,
        nextReviewDate: new Date('2024-10-01'),
        ownerId: adminId,
        requiresAcknowledgment: false,
        isActive: true
      }
    ];

    await db.insert(compliancePolicies).values(policiesData);
    console.log('[Compliance Seed] Created 5 compliance policies');

    console.log('[Compliance Seed] ✅ Compliance demo data seeded successfully!');
  } catch (error) {
    // Log error but don't crash the app - seeding is optional
    console.error('[Compliance Seed] Error seeding compliance data (non-fatal):', error);
  }
}
