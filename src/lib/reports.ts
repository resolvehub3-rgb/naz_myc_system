import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { AttendanceRecord, AttendanceSession, Member } from '../types/database';

export interface ReportSummaryData {
  session: AttendanceSession;
  records: AttendanceRecord[];
  totalMembersCount: number;
}

/**
 * Generates and downloads an official Methodist Church Ghana MYC Attendance Report PDF
 */
export function generateAttendancePdfReport(data: ReportSummaryData): void {
  const { session, records, totalMembersCount } = data;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const memberRecords = records.filter(r => r.member_id);
  const visitorRecords = records.filter(r => r.visitor_id);
  const walkInRecords = records.filter(r => r.attendance_method === 'Walk-in Registration');

  const attendanceRate = totalMembersCount > 0
    ? Math.round((memberRecords.length / totalMembersCount) * 100)
    : 0;

  // Header Bar
  pdf.setFillColor(11, 35, 69); // #0B2345
  pdf.rect(0, 0, 210, 24, 'F');

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('METHODIST CHURCH GHANA – MYC', 105, 11, { align: 'center' });
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Faith • Hope • Love | Official Attendance Report', 105, 18, { align: 'center' });

  // Session Details Box
  pdf.setTextColor(18, 59, 112);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(session.session_name, 14, 34);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Activity Type: ${session.activity_type}`, 14, 40);
  pdf.text(`Meeting Date: ${session.meeting_date} | Time: ${session.start_time}`, 14, 45);
  pdf.text(`Status: ${session.status.toUpperCase()}`, 14, 50);

  // Statistics Summary Cards
  const cardY = 56;
  const cardW = 42;
  const cardH = 18;

  // Card 1: Registered
  pdf.setFillColor(234, 246, 255); // light blue
  pdf.roundedRect(14, cardY, cardW, cardH, 2, 2, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Total Members', 17, cardY + 6);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(18, 59, 112);
  pdf.text(String(totalMembersCount), 17, cardY + 14);

  // Card 2: Present Members
  pdf.setFillColor(234, 246, 255);
  pdf.roundedRect(61, cardY, cardW, cardH, 2, 2, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Members Present', 64, cardY + 6);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(18, 59, 112);
  pdf.text(`${memberRecords.length} (${attendanceRate}%)`, 64, cardY + 14);

  // Card 3: Visitors
  pdf.setFillColor(234, 246, 255);
  pdf.roundedRect(108, cardY, cardW, cardH, 2, 2, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Visitors / Walk-ins', 111, cardY + 6);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(18, 59, 112);
  pdf.text(String(visitorRecords.length + walkInRecords.length), 111, cardY + 14);

  // Card 4: Total Attendance
  pdf.setFillColor(18, 59, 112);
  pdf.roundedRect(155, cardY, cardW, cardH, 2, 2, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(200, 220, 255);
  pdf.text('Total Attendance', 158, cardY + 6);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(String(records.length), 158, cardY + 14);

  // Attendance Records Table Header
  let tableY = 82;
  pdf.setFillColor(241, 245, 249);
  pdf.rect(14, tableY, 182, 8, 'F');

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text('#', 17, tableY + 5.5);
  pdf.text('Attendee Name', 26, tableY + 5.5);
  pdf.text('ID / Type', 88, tableY + 5.5);
  pdf.text('Phone', 122, tableY + 5.5);
  pdf.text('Arrival Time', 155, tableY + 5.5);
  pdf.text('Method', 182, tableY + 5.5);

  tableY += 8;

  // Render Table Rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);

  records.forEach((record, index) => {
    // Page overflow check
    if (tableY > 275) {
      pdf.addPage('a4', 'portrait');
      tableY = 20;

      // Repeat Table Header
      pdf.setFillColor(241, 245, 249);
      pdf.rect(14, tableY, 182, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text('#', 17, tableY + 5.5);
      pdf.text('Attendee Name', 26, tableY + 5.5);
      pdf.text('ID / Type', 88, tableY + 5.5);
      pdf.text('Phone', 122, tableY + 5.5);
      pdf.text('Arrival Time', 155, tableY + 5.5);
      pdf.text('Method', 182, tableY + 5.5);
      tableY += 8;
      pdf.setFont('helvetica', 'normal');
    }

    const name = record.member?.full_name || record.visitor?.full_name || 'Attendee';
    const idOrType = record.member?.membership_number || (record.visitor ? 'Visitor' : 'Walk-in');
    const phone = record.member?.telephone || record.visitor?.telephone || '—';
    const time = new Date(record.arrival_timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const method = record.attendance_method;

    // Alternate row stripe
    if (index % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(14, tableY, 182, 7, 'F');
    }

    pdf.setTextColor(51, 65, 85);
    pdf.text(String(index + 1), 17, tableY + 5);
    pdf.text(name.slice(0, 30), 26, tableY + 5);
    pdf.text(idOrType, 88, tableY + 5);
    pdf.text(phone, 122, tableY + 5);
    pdf.text(time, 155, tableY + 5);
    pdf.text(method.slice(0, 12), 182, tableY + 5);

    tableY += 7;
  });

  // Footer
  const pageCount = pdf.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    pdf.setPage(p);
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      `Generated on ${new Date().toLocaleString('en-GB')} | Methodist Church Ghana - MYC Digital Attendance System | Page ${p} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  const safeSessionName = session.session_name.replace(/[^a-zA-Z0-9]/g, '_');
  pdf.save(`MYC_Attendance_${safeSessionName}_${session.meeting_date}.pdf`);
}

/**
 * Generates and downloads a clean, structured Excel (.xlsx) workbook of attendance records
 */
export function exportAttendanceToExcel(data: {
  sessionName?: string;
  records: AttendanceRecord[];
}): void {
  const { sessionName, records } = data;

  const excelRows = records.map((record, index) => {
    const isMember = Boolean(record.member_id);
    const name = record.member?.full_name || record.visitor?.full_name || 'Attendee';
    const membershipId = record.member?.membership_number || '';
    const attendeeType = isMember ? 'Registered Member' : (record.visitor ? 'Visitor' : 'Walk-in');
    const phone = record.member?.telephone || record.visitor?.telephone || '';
    const email = record.member?.email || record.visitor?.email || '';
    const arrivalDate = new Date(record.arrival_timestamp).toLocaleDateString('en-GB');
    const arrivalTime = new Date(record.arrival_timestamp).toLocaleTimeString('en-GB');

    return {
      'No.': index + 1,
      'Attendee Name': name,
      'Membership ID': membershipId,
      'Category': attendeeType,
      'Phone Number': phone,
      'Email': email,
      'Date': arrivalDate,
      'Arrival Time': arrivalTime,
      'Recording Method': record.attendance_method,
      'Notes': record.notes || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelRows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No.
    { wch: 26 }, // Attendee Name
    { wch: 16 }, // Membership ID
    { wch: 18 }, // Category
    { wch: 16 }, // Phone Number
    { wch: 24 }, // Email
    { wch: 14 }, // Date
    { wch: 14 }, // Arrival Time
    { wch: 20 }, // Recording Method
    { wch: 20 }, // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

  const filename = sessionName
    ? `MYC_Attendance_${sessionName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
    : `MYC_Attendance_Export_${Date.now()}.xlsx`;

  XLSX.writeFile(workbook, filename);
}
