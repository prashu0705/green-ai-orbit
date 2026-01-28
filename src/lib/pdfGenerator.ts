import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CertificateData {
  modelName: string;
  trainingDate: string;
  totalCO2: number;
  renewablePercent: number;
  certificateHash: string;
  isVerified: boolean;
}

interface ReportData {
  co2Savings: number;
  efficiencyGain: number;
  renewablePercent: number;
  emissionData: { month: string; current: number; baseline: number }[];
  insights: { type: string; title: string; description: string; highlight?: string }[];
  generatedDate: string;
}

interface ModelReportData {
  name: string;
  version: string;
  status: string;
  regionCode: string;
  gpuHours: number;
  gpuCount: number;
  energyKwh: number;
  co2Emissions: number;
  efficiencyScore: number;
  createdAt: string;
  lastDeployedAt: string;
}

const COLORS = {
  primary: [20, 184, 166] as [number, number, number], // Teal
  secondary: [16, 185, 129] as [number, number, number], // Emerald
  dark: [30, 41, 59] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
};

export const generateCertificatePDF = (data: CertificateData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header with gradient effect (simulated)
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Logo placeholder
  doc.setFillColor(255, 255, 255);
  doc.circle(30, 25, 12, 'F');
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('EC', 25, 28);
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('EcoCompute', 50, 22);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Green AI Provenance Certificate', 50, 32);
  
  // Verification badge
  if (data.isVerified) {
    doc.setFillColor(...COLORS.secondary);
    doc.roundedRect(pageWidth - 60, 15, 50, 20, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('✓ VERIFIED', pageWidth - 52, 27);
  }
  
  // Main content area
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 60, pageWidth - 30, 180, 3, 3, 'S');
  
  // Certificate title
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Certificate of Sustainability', pageWidth / 2, 85, { align: 'center' });
  
  // Description
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const description = 'This document certifies that the computational resources utilized for the training and deployment of the AI model listed below adhere to the strict environmental standards of the EcoCompute Protocol.';
  const splitDescription = doc.splitTextToSize(description, pageWidth - 60);
  doc.text(splitDescription, pageWidth / 2, 100, { align: 'center' });
  
  // Details grid
  const startY = 130;
  const leftCol = 25;
  const rightCol = pageWidth / 2 + 10;
  
  // Model Identity
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(9);
  doc.text('MODEL IDENTITY', leftCol, startY);
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.modelName, leftCol, startY + 10);
  
  // Training Date
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('TRAINING DATE', rightCol, startY);
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(new Date(data.trainingDate).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric' 
  }), rightCol, startY + 10);
  
  // Total Emissions
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL EMISSIONS', leftCol, startY + 35);
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.totalCO2} t CO₂e`, leftCol, startY + 45);
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Offset Verified', leftCol, startY + 52);
  
  // Energy Source
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(9);
  doc.text('ENERGY SOURCE', rightCol, startY + 35);
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.renewablePercent}%`, rightCol, startY + 45);
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Renewable (Wind/Solar)', rightCol, startY + 52);
  
  // Certificate hash
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(25, 210, pageWidth - 25, 210);
  
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(9);
  doc.text('CERTIFICATE HASH (SHA-256)', pageWidth / 2, 220, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('courier', 'normal');
  doc.text(data.certificateHash, pageWidth / 2, 230, { align: 'center' });
  
  // Footer
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleDateString()} by EcoCompute Platform`, pageWidth / 2, 280, { align: 'center' });
  
  doc.save(`ecocompute-certificate-${data.certificateHash.slice(0, 8)}.pdf`);
};

export const generatePerformanceReportPDF = (data: ReportData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('EcoCompute Performance Report', 15, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${data.generatedDate}`, 15, 33);
  
  // Executive Summary
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 15, 55);
  
  // Stats boxes
  const boxY = 62;
  const boxWidth = (pageWidth - 45) / 3;
  
  // CO2 Savings
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(15, boxY, boxWidth, 35, 3, 3, 'F');
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.co2Savings}t`, 20, boxY + 18);
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(9);
  doc.text('CO₂ SAVINGS', 20, boxY + 28);
  
  // Efficiency
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(20 + boxWidth, boxY, boxWidth, 35, 3, 3, 'F');
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`+${data.efficiencyGain}%`, 25 + boxWidth, boxY + 18);
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(9);
  doc.text('EFFICIENCY', 25 + boxWidth, boxY + 28);
  
  // Renewable
  doc.setFillColor(254, 252, 232);
  doc.roundedRect(25 + boxWidth * 2, boxY, boxWidth, 35, 3, 3, 'F');
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.renewablePercent}%`, 30 + boxWidth * 2, boxY + 18);
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(9);
  doc.text('RENEWABLE', 30 + boxWidth * 2, boxY + 28);
  
  // Emissions Table
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Emissions Over Time', 15, 115);
  
  autoTable(doc, {
    startY: 120,
    head: [['Month', 'Current (t)', 'Baseline (t)', 'Savings']],
    body: data.emissionData.map(d => [
      d.month,
      d.current.toFixed(2),
      d.baseline.toFixed(2),
      `${((1 - d.current / d.baseline) * 100).toFixed(1)}%`
    ]),
    theme: 'striped',
    headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
    styles: { fontSize: 10 },
    margin: { left: 15, right: 15 },
  });
  
  // AI Insights
  const tableEndY = (doc as any).lastAutoTable.finalY + 15;
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Insights', 15, tableEndY);
  
  let insightY = tableEndY + 8;
  data.insights.forEach((insight) => {
    const icon = insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✓' : 'ℹ️';
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${icon} ${insight.title}`, 15, insightY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(10);
    const text = insight.highlight ? `${insight.description} ${insight.highlight}` : insight.description;
    doc.text(text, 15, insightY + 6);
    insightY += 18;
  });
  
  // Footer
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(8);
  doc.text('Generated by EcoCompute Platform', pageWidth / 2, 285, { align: 'center' });
  
  doc.save(`ecocompute-performance-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateModelReportPDF = (model: ModelReportData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`Model Carbon Report: ${model.name}`, 15, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Version: ${model.version} | Status: ${model.status}`, 15, 33);
  
  // Model Details
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Model Overview', 15, 55);
  
  autoTable(doc, {
    startY: 60,
    body: [
      ['Region', model.regionCode],
      ['GPU Count', model.gpuCount.toString()],
      ['GPU Hours', `${model.gpuHours.toFixed(1)} hours`],
      ['Energy Consumed', `${model.energyKwh.toFixed(2)} kWh`],
      ['CO₂ Emissions', `${model.co2Emissions.toFixed(3)} tonnes`],
      ['Efficiency Score', `${model.efficiencyScore}/100`],
      ['Created', new Date(model.createdAt).toLocaleDateString()],
      ['Last Deployed', new Date(model.lastDeployedAt).toLocaleDateString()],
    ],
    theme: 'plain',
    styles: { fontSize: 11 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 100 },
    },
    margin: { left: 15, right: 15 },
  });
  
  // Carbon footprint visualization
  const chartY = 170;
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Environmental Impact', 15, chartY);
  
  // Simple bar visualization
  const barWidth = 150;
  const barHeight = 20;
  const barY = chartY + 10;
  
  // Background bar
  doc.setFillColor(229, 231, 235);
  doc.roundedRect(15, barY, barWidth, barHeight, 3, 3, 'F');
  
  // Filled bar (based on efficiency)
  const fillWidth = (model.efficiencyScore / 100) * barWidth;
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(15, barY, fillWidth, barHeight, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${model.efficiencyScore}% Efficient`, 20, barY + 14);
  
  // Footer
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(8);
  doc.text('Generated by EcoCompute Platform', pageWidth / 2, 285, { align: 'center' });
  
  doc.save(`ecocompute-model-${model.name.toLowerCase().replace(/\s+/g, '-')}-report.pdf`);
};
