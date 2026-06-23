import { ApiLead } from '@/components/leads/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateQuotationPDF = async (lead: ApiLead) => {
  if (!lead.quotation) return;

  const { date, solarModule, inverter, options = [], rows = [] } = lead.quotation;

  const formattedDate = date ? new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).replace(',', '').toUpperCase() : new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).replace(',', '').toUpperCase();

  // Create a container element off-screen
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px'; // standard A4-like width in pixels
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '40px';
  container.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #a63c71; padding-bottom: 20px; margin-bottom: 30px;">
      <div style="font-size: 28px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; letter-spacing: 1px;">
        SMS <span style="color: #a63c71;">Solar</span>
      </div>
      <div style="text-align: right;">
        <h1 style="margin: 0; font-size: 24px; color: #1e1b4b; font-weight: 700;">SOLAR SYSTEM QUOTATION</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">Date: ${formattedDate}</p>
      </div>
    </div>

    <div style="display: flex; gap: 20px; margin-bottom: 30px;">
      <div style="flex: 1; background-color: #fdf2f7; border: 1px solid #fbcfe8; border-radius: 12px; padding: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #a63c71; letter-spacing: 0.5px; border-bottom: 1.5px solid #fbcfe8; padding-bottom: 5px;">Customer Details</h3>
        <p style="margin: 8px 0; font-size: 14px; color: #4b5563;"><strong>Name:</strong> ${lead.fullName || 'N/A'}</p>
        <p style="margin: 8px 0; font-size: 14px; color: #4b5563;"><strong>Phone:</strong> ${lead.contact || 'N/A'}</p>
        <p style="margin: 8px 0; font-size: 14px; color: #4b5563;"><strong>Email:</strong> ${lead.email || 'N/A'}</p>
        <p style="margin: 8px 0; font-size: 14px; color: #4b5563;"><strong>Address:</strong> ${lead.address || 'N/A'}</p>
      </div>
      <div style="flex: 1; background-color: #fdf2f7; border: 1px solid #fbcfe8; border-radius: 12px; padding: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #a63c71; letter-spacing: 0.5px; border-bottom: 1.5px solid #fbcfe8; padding-bottom: 5px;">Technical Details</h3>
        <p style="margin: 8px 0; font-size: 14px; color: #4b5563;"><strong>Solar Module:</strong> ${solarModule || 'N/A'}</p>
        <p style="margin: 8px 0; font-size: 14px; color: #4b5563;"><strong>Inverter:</strong> ${inverter || 'N/A'}</p>
        <p style="margin: 8px 0; font-size: 14px; color: #4b5563;"><strong>Quotation Date:</strong> ${formattedDate}</p>
      </div>
    </div>

    <div style="margin-bottom: 30px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
        <thead>
          <tr style="background-color: #a63c71; color: white;">
            <th style="padding: 14px 18px; text-transform: uppercase; font-size: 12px; font-weight: 700; border: 1px solid #e5e7eb;">Row Title</th>
            ${options.map(opt => `<th style="padding: 14px 18px; text-transform: uppercase; font-size: 12px; font-weight: 700; border: 1px solid #e5e7eb;">${opt}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, index) => `
            <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#fdf2f7'};">
              <td style="padding: 14px 18px; font-weight: 700; color: #1e1b4b; border: 1px solid #e5e7eb; background-color: #fdf2f7;">${row.title}</td>
              ${row.values.map(val => `<td style="padding: 14px 18px; border: 1px solid #e5e7eb;">${val || '-'}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div style="margin-top: 60px; border-top: 1.5px solid #fbcfe8; padding-top: 20px; display: flex; justify-content: space-between; font-size: 12px; color: #6b7280;">
      <div>
        <p style="margin: 5px 0;">Thank you for choosing SMS Solar.</p>
        <p style="margin: 5px 0;">This is a computer-generated quotation.</p>
      </div>
      <div style="text-align: center; width: 200px;">
        <div style="border-bottom: 1.5px solid #a63c71; height: 50px; margin-bottom: 8px;"></div>
        <p style="margin: 0; font-weight: 600; color: #1e1b4b;">Authorized Signature</p>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // high quality
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 standard width (mm)
    const pageHeight = 297; // A4 standard height (mm)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const cleanedName = lead.fullName?.replace(/\s+/g, '_') || 'Lead';
    pdf.save(`Quotation_${cleanedName}.pdf`);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    alert('Failed to download PDF. Please try again.');
  } finally {
    document.body.removeChild(container);
  }
};
