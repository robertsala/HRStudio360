import jsPDF from 'jspdf';

export interface PayStubData {
  employeeName: string;
  employeeId: string;
  employeeAddress: string;
  payPeriod: string;
  payDate: string;
  grossPay: number;
  netPay: number;
  regularHours: number;
  overtimeHours: number;
  regularRate: number;
  overtimeRate: number;
  regularPay: number;
  overtimePay: number;
  deductions: {
    federalTax: number;
    stateTax: number;
    socialSecurity: number;
    medicare: number;
    healthInsurance: number;
    dentalInsurance: number;
    visionInsurance: number;
    retirement401k: number;
    lifeInsurance: number;
    disabilityInsurance: number;
    parking: number;
    other: number;
  };
  ytdTotals: {
    grossPay: number;
    netPay: number;
    federalTax: number;
    stateTax: number;
    socialSecurity: number;
    medicare: number;
    totalDeductions: number;
  };
  companyInfo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    ein: string;
  };
  funFact?: string;
}

export const generatePayStubPDF = (payStubData: PayStubData): void => {
  const doc = new jsPDF();
  
  // Simple, clean layout
  let y = 20;
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Pay Statement', 105, y, { align: 'center' } as any);
  y += 15;
  
  // Company info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('© 2025 HRStudio360, Inc.', 20, y);
  y += 10;
  
  // Pay period info
  doc.text(`Pay Period: ${payStubData.payPeriod}`, 20, y);
  doc.text(`Pay Date: ${payStubData.payDate}`, 120, y);
  y += 15;
  
  // Employee info
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Information:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${payStubData.employeeName}`, 20, y);
  doc.text(`ID: ${payStubData.employeeId}`, 120, y);
  y += 8;
  doc.text(`Address: ${payStubData.employeeAddress}`, 20, y);
  y += 15;
  
  // Earnings section
  doc.setFont('helvetica', 'bold');
  doc.text('EARNINGS', 20, y);
  y += 8;
  
  // Earnings table headers
  doc.setFont('helvetica', 'normal');
  doc.text('Description', 20, y);
  doc.text('Rate', 70, y);
  doc.text('Hours', 100, y);
  doc.text('This Period', 130, y);
  doc.text('Year to Date', 170, y);
  y += 5;
  
  // Line under headers
  doc.line(20, y, 200, y);
  y += 8;
  
  // Regular pay
  doc.text('Regular Pay', 20, y);
  doc.text(`$${payStubData.regularRate.toFixed(2)}`, 70, y);
  doc.text(`${payStubData.regularHours.toFixed(1)}`, 100, y);
  doc.text(`$${payStubData.regularPay.toFixed(2)}`, 130, y);
  doc.text(`$${payStubData.ytdTotals.grossPay.toFixed(2)}`, 170, y);
  y += 8;
  
  // Overtime (if any)
  if (payStubData.overtimeHours > 0) {
    doc.text('Overtime Pay', 20, y);
    doc.text(`$${payStubData.overtimeRate.toFixed(2)}`, 70, y);
    doc.text(`${payStubData.overtimeHours.toFixed(1)}`, 100, y);
    doc.text(`$${payStubData.overtimePay.toFixed(2)}`, 130, y);
    y += 8;
  }
  
  // Gross pay total
  doc.line(20, y, 200, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('GROSS PAY', 20, y);
  doc.text(`$${payStubData.grossPay.toFixed(2)}`, 130, y);
  doc.text(`$${payStubData.ytdTotals.grossPay.toFixed(2)}`, 170, y);
  y += 15;
  
  // Deductions section
  doc.text('DEDUCTIONS', 20, y);
  y += 8;
  
  // Deduction headers
  doc.setFont('helvetica', 'normal');
  doc.text('Description', 20, y);
  doc.text('This Period', 130, y);
  doc.text('Year to Date', 170, y);
  y += 5;
  doc.line(20, y, 200, y);
  y += 8;
  
  // Tax deductions
  doc.text('Federal Income Tax', 20, y);
  doc.text(`-$${payStubData.deductions.federalTax.toFixed(2)}`, 130, y);
  doc.text(`-$${payStubData.ytdTotals.federalTax.toFixed(2)}`, 170, y);
  y += 6;
  
  doc.text('Social Security Tax', 20, y);
  doc.text(`-$${payStubData.deductions.socialSecurity.toFixed(2)}`, 130, y);
  doc.text(`-$${payStubData.ytdTotals.socialSecurity.toFixed(2)}`, 170, y);
  y += 6;
  
  doc.text('Medicare Tax', 20, y);
  doc.text(`-$${payStubData.deductions.medicare.toFixed(2)}`, 130, y);
  doc.text(`-$${payStubData.ytdTotals.medicare.toFixed(2)}`, 170, y);
  y += 6;
  
  // Benefits deductions
  doc.text('Health Insurance', 20, y);
  doc.text(`-$${payStubData.deductions.healthInsurance.toFixed(2)}`, 130, y);
  doc.text(`-$${(payStubData.deductions.healthInsurance * 26).toFixed(2)}`, 170, y);
  y += 6;
  
  doc.text('401(k) Contribution', 20, y);
  doc.text(`-$${payStubData.deductions.retirement401k.toFixed(2)}`, 130, y);
  doc.text(`-$${(payStubData.deductions.retirement401k * 26).toFixed(2)}`, 170, y);
  y += 15;
  
  // Net pay
  doc.line(20, y, 200, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('NET PAY', 20, y);
  doc.text(`$${payStubData.netPay.toFixed(2)}`, 130, y);
  doc.text(`$${payStubData.ytdTotals.netPay.toFixed(2)}`, 170, y);
  y += 15;
  
  // Direct deposit info
  doc.setFont('helvetica', 'normal');
  doc.text('Direct Deposit:', 20, y);
  doc.text(`$${payStubData.netPay.toFixed(2)}`, 130, y);
  y += 8;
  
  doc.text('Net Check:', 20, y);
  doc.text('$0.00', 130, y);
  y += 15;
  
  // Deposit box
  doc.rect(20, y, 160, 30);
  doc.text('Deposited to the account of:', 25, y + 8);
  doc.text('Account: xxxxxxxxx7362', 25, y + 16);
  doc.text('ABA: xxxx xxxx', 25, y + 24);
  doc.text(`Amount: $${payStubData.netPay.toFixed(2)}`, 120, y + 16);

  // NON-NEGOTIABLE watermark
  doc.setFontSize(16);
  doc.setTextColor(150, 150, 150);
  doc.text('NON-NEGOTIABLE', 100, y + 20, { align: 'center' } as any);
  doc.setTextColor(0, 0, 0);
  y += 40;

  // Fun Fact section (if available)
  if (payStubData.funFact) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(255, 248, 220);
    doc.roundedRect(20, y, 170, 20, 3, 3, 'F');

    doc.setTextColor(180, 83, 9);
    doc.text('Fun Paycheck Fact:', 25, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 53, 15);

    const maxWidth = 160;
    const lines = doc.splitTextToSize(payStubData.funFact, maxWidth);
    doc.text(lines, 25, y + 14);

    doc.setTextColor(0, 0, 0);
    y += 25;
  }

  // Footer
  doc.setFontSize(9);
  doc.text('HRStudio360 Payroll Services', 20, y);
  doc.text('123 Business Ave, Amherst, NH 03031', 20, y + 5);
  doc.text('Phone: 1-800-HR-STUDIO', 20, y + 10);

  // Download
  const filename = `PayStub_${payStubData.employeeName.replace(/\s+/g, '_')}_${payStubData.payPeriod.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

export const generateW2PDF = (w2Data: any): void => {
  const doc = new jsPDF();
  
  // Simple W-2 layout
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Form W-2 - Wage and Tax Statement', 105, 20, { align: 'center' } as any);
  
  let y = 40;
  doc.setFontSize(12);
  doc.text(`Tax Year: ${w2Data.taxYear}`, 105, y, { align: 'center' } as any);
  y += 20;
  
  // Employer info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Employer:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(w2Data.employer?.name || 'HRStudio360', 20, y);
  doc.text(w2Data.employer?.address || '123 Business Ave', 20, y + 6);
  doc.text(`${w2Data.employer?.city || 'Amherst'}, ${w2Data.employer?.state || 'NH'} ${w2Data.employer?.zipCode || '03031'}`, 20, y + 12);
  doc.text(`EIN: ${w2Data.employer?.ein || '12-3456789'}`, 20, y + 18);
  
  // Employee info
  doc.setFont('helvetica', 'bold');
  doc.text('Employee:', 120, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(w2Data.employee?.name || 'Current User', 120, y);
  doc.text(w2Data.employee?.address || '123 Main St', 120, y + 6);
  doc.text(`${w2Data.employee?.city || 'Anytown'}, ${w2Data.employee?.state || 'ST'} ${w2Data.employee?.zipCode || '12345'}`, 120, y + 12);
  doc.text(`SSN: ${w2Data.employee?.ssn || 'XXX-XX-1234'}`, 120, y + 18);
  
  y += 35;
  
  // W-2 boxes in simple format
  const w2Boxes = [
    { label: 'Box 1 - Wages, tips, other compensation', amount: w2Data.wages || 98000 },
    { label: 'Box 2 - Federal income tax withheld', amount: w2Data.federalTax || 14700 },
    { label: 'Box 3 - Social security wages', amount: w2Data.socialSecurityWages || 98000 },
    { label: 'Box 4 - Social security tax withheld', amount: w2Data.socialSecurityTax || 6076 },
    { label: 'Box 5 - Medicare wages and tips', amount: w2Data.medicareWages || 98000 },
    { label: 'Box 6 - Medicare tax withheld', amount: w2Data.medicareTax || 1421 }
  ];
  
  w2Boxes.forEach(box => {
    doc.text(box.label, 20, y);
    doc.text(`$${box.amount.toLocaleString()}`, 150, y);
    y += 8;
  });
  
  // Footer
  y += 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Generated by HRStudio360 Payroll System', 105, y, { align: 'center' } as any);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, y + 5, { align: 'center' } as any);
  
  const filename = `W2_${w2Data.taxYear}_${(w2Data.employee?.name || 'Current_User').replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

export const generateBenefitsSummaryPDF = (benefitsData: any): void => {
  const doc = new jsPDF();
  
  // Simple benefits summary
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Benefits Summary', 105, 20, { align: 'center' } as any);
  
  let y = 40;
  doc.setFontSize(12);
  doc.text(`Employee: ${benefitsData.employeeName || 'Current User'}`, 105, y, { align: 'center' } as any);
  doc.text(`Plan Year: ${benefitsData.planYear || '2025'}`, 105, y + 8, { align: 'center' } as any);
  
  y += 25;
  
  const benefits = benefitsData.benefits || [];
  benefits.forEach((benefit: any) => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(benefit.name || 'Benefit', 20, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Plan: ${benefit.plan || 'N/A'}`, 20, y);
    doc.text(`Coverage: ${benefit.coverage || 'N/A'}`, 20, y + 6);
    doc.text(`Employee Cost: $${benefit.employeeCost || 0}/month`, 20, y + 12);
    doc.text(`Company Cost: $${benefit.employerCost || 0}/month`, 120, y + 12);
    
    y += 25;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Generated by HRStudio360 Benefits Administration', 105, y + 10, { align: 'center' } as any);
  
  const filename = `Benefits_Summary_${(benefitsData.employeeName || 'Current_User').replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};