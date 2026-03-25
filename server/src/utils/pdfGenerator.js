import PDFDocument from 'pdfkit';

/**
 * Generate a basic production report PDF.
 * @param {Object} data - Report data.
 * @param {WritableStream} stream - e.g. res from Express
 */
export function generateProductionReport(data, stream) {
  const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
  doc.pipe(stream);

  // Header
  doc.fontSize(20).fillColor('#D4AF37')
    .text('GOLD TRACE PLATFORM', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).fillColor('#333')
    .text('Reporte de Producción', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#666')
    .text(`Período: ${data.period}`, { align: 'center' });
  doc.moveDown(1);

  // Divider
  doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#D4AF37');
  doc.moveDown(1);

  // Summary
  doc.fontSize(12).fillColor('#333')
    .text('Resumen', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#444');
  doc.text(`Total de lotes registrados: ${data.totalLots}`);
  doc.text(`Peso bruto total (g): ${data.totalGrossWeight}`);
  doc.text(`Oro fino estimado (g): ${data.totalFineGold}`);
  doc.text(`Barras producidas: ${data.totalBars}`);
  doc.text(`Traspasos realizados: ${data.totalTransfers}`);
  doc.moveDown(1);

  // Lots table
  if (data.lots && data.lots.length > 0) {
    doc.fontSize(12).fillColor('#333')
      .text('Detalle de Lotes', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const col1 = 50, col2 = 150, col3 = 280, col4 = 370, col5 = 460;

    // Header row
    doc.fontSize(9).fillColor('#D4AF37');
    doc.text('Código', col1, tableTop);
    doc.text('Mina', col2, tableTop);
    doc.text('Peso Bruto (g)', col3, tableTop);
    doc.text('Oro Fino (g)', col4, tableTop);
    doc.text('Estado', col5, tableTop);
    doc.moveDown(0.5);

    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#eee');
    doc.moveDown(0.3);

    // Data rows
    doc.fillColor('#444');
    for (const lot of data.lots) {
      const y = doc.y;
      if (y > 700) {
        doc.addPage();
      }
      doc.text(lot.code, col1, doc.y, { width: 90 });
      const currentY = doc.y - doc.currentLineHeight();
      doc.text(lot.mineName || '-', col2, currentY, { width: 120 });
      doc.text(String(lot.grossWeightGrams), col3, currentY, { width: 80 });
      doc.text(String(lot.fineGold || '-'), col4, currentY, { width: 80 });
      doc.text(lot.status, col5, currentY, { width: 80 });
      doc.moveDown(0.3);
    }
  }

  // Footer
  doc.moveDown(2);
  doc.fontSize(8).fillColor('#999')
    .text(`Generado el: ${new Date().toISOString()}`, { align: 'center' });
  doc.text('Gold Trace Platform — Documento de uso interno', { align: 'center' });

  doc.end();
}

/**
 * Generate a custody transfer mobility guide PDF.
 */
export function generateTransferGuide(transfer, stream) {
  const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
  doc.pipe(stream);

  doc.fontSize(18).fillColor('#D4AF37')
    .text('GUÍA DE MOVILIZACIÓN', { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(11).fillColor('#333');
  doc.text(`Código del lote/barra: ${transfer.lotCode || transfer.barCode || 'N/A'}`);
  doc.text(`Fecha de traspaso: ${new Date(transfer.createdAt).toLocaleString('es-CO')}`);
  doc.moveDown(0.5);

  doc.text(`Entrega: ${transfer.senderName}`);
  doc.text(`Recibe: ${transfer.receiverName}`);
  doc.text(`Peso registrado: ${transfer.weightGrams} g`);
  doc.moveDown(0.5);

  if (transfer.latitude && transfer.longitude) {
    doc.text(`Ubicación GPS: ${transfer.latitude}, ${transfer.longitude}`);
  }

  doc.moveDown(0.5);
  doc.text(`Estado: ${transfer.status}`);
  if (transfer.observations) {
    doc.text(`Observaciones: ${transfer.observations}`);
  }

  doc.moveDown(2);
  doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke('#333');
  doc.moveDown(0.3);
  doc.text('Firma del que entrega');

  doc.moveDown(1.5);
  doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke('#333');
  doc.moveDown(0.3);
  doc.text('Firma del que recibe');

  doc.moveDown(2);
  doc.fontSize(8).fillColor('#999')
    .text(`Generado el: ${new Date().toISOString()}`, { align: 'center' });

  doc.end();
}
