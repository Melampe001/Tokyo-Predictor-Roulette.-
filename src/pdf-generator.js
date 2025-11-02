import PDFDocument from 'pdfkit';
import fs from 'fs';

/**
 * Generador de documentos PDF para reportes de análisis
 */
export class PDFGenerator {
  /**
   * Genera un PDF con los resultados del análisis
   * @param {Array} results - Array de resultados con estructura: {resultado, probabilidad, fecha, hora}
   * @param {string} outputPath - Ruta donde guardar el PDF
   * @returns {Promise<string>} Ruta del archivo generado
   */
  static async generateReport(results, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });
        
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Título
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('TokioAI - Reporte de Análisis Predictivo', { align: 'center' })
           .moveDown();

        // Fecha de generación
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Generado: ${new Date().toLocaleString('es-ES')}`, { align: 'right' })
           .moveDown(2);

        // Encabezado de tabla
        const startY = doc.y;
        const colWidth = {
          resultado: 100,
          probabilidad: 120,
          fecha: 120,
          hora: 100
        };

        doc.fontSize(12)
           .font('Helvetica-Bold');

        let x = 50;
        doc.text('Resultado', x, startY, { width: colWidth.resultado, continued: false });
        x += colWidth.resultado;
        doc.text('Probabilidad', x, startY, { width: colWidth.probabilidad, continued: false });
        x += colWidth.probabilidad;
        doc.text('Fecha', x, startY, { width: colWidth.fecha, continued: false });
        x += colWidth.fecha;
        doc.text('Hora', x, startY, { width: colWidth.hora, continued: false });

        // Línea separadora
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke();
        doc.moveDown(0.5);

        // Datos de la tabla
        doc.fontSize(10)
           .font('Helvetica');

        results.forEach((result, index) => {
          const y = doc.y;
          
          // Verificar si necesitamos una nueva página
          if (y > 700) {
            doc.addPage();
          }

          let x = 50;
          doc.text(result.resultado.toString(), x, doc.y, { 
            width: colWidth.resultado, 
            continued: false 
          });
          
          const currentY = doc.y - 12; // Ajustar para alinear en la misma línea
          x += colWidth.resultado;
          doc.text(
            result.probabilidad ? `${(result.probabilidad * 100).toFixed(2)}%` : 'N/A', 
            x, 
            currentY, 
            { width: colWidth.probabilidad, continued: false }
          );
          
          x += colWidth.probabilidad;
          doc.text(result.fecha, x, currentY, { 
            width: colWidth.fecha, 
            continued: false 
          });
          
          x += colWidth.fecha;
          doc.text(result.hora, x, currentY, { 
            width: colWidth.hora, 
            continued: false 
          });

          doc.moveDown(0.8);

          // Línea separadora cada 5 filas
          if ((index + 1) % 5 === 0 && index < results.length - 1) {
            doc.moveTo(50, doc.y)
               .lineTo(550, doc.y)
               .strokeOpacity(0.3)
               .stroke()
               .strokeOpacity(1);
            doc.moveDown(0.5);
          }
        });

        // Pie de página
        doc.moveDown(2);
        doc.fontSize(8)
           .fillColor('gray')
           .text(
             `Total de registros: ${results.length}`,
             50,
             doc.page.height - 70,
             { align: 'center' }
           );

        doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          reject(new Error(`Error al escribir PDF: ${error.message}`));
        });

      } catch (error) {
        reject(new Error(`Error al generar PDF: ${error.message}`));
      }
    });
  }

  /**
   * Genera un reporte resumido con estadísticas
   * @param {Array} results - Array de resultados
   * @param {object} statistics - Estadísticas del análisis
   * @param {string} outputPath - Ruta donde guardar el PDF
   * @returns {Promise<string>} Ruta del archivo generado
   */
  static async generateSummaryReport(results, statistics, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Título
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('TokioAI - Reporte Estadístico', { align: 'center' })
           .moveDown(2);

        // Estadísticas generales
        doc.fontSize(14)
           .text('Estadísticas Generales')
           .moveDown();

        doc.fontSize(11)
           .font('Helvetica');

        const stats = [
          `Total de resultados: ${statistics.totalResults || results.length}`,
          `Tendencia dominante: ${statistics.dominantTrend || 'N/A'}`,
          `Resultado más frecuente: ${statistics.mostFrequent || 'N/A'}`,
          `Precisión del modelo: ${statistics.accuracy ? (statistics.accuracy * 100).toFixed(2) + '%' : 'N/A'}`,
          `Última actualización: ${statistics.lastUpdate || new Date().toLocaleString('es-ES')}`
        ];

        stats.forEach(stat => {
          doc.text(`• ${stat}`);
          doc.moveDown(0.5);
        });

        doc.moveDown();

        // Sugerencia optimizada
        if (statistics.suggestion) {
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .fillColor('blue')
             .text('Sugerencia Optimizada')
             .moveDown();

          doc.fontSize(11)
             .font('Helvetica')
             .fillColor('black')
             .text(statistics.suggestion)
             .moveDown(2);
        }

        doc.end();

        stream.on('finish', () => resolve(outputPath));
        stream.on('error', (error) => reject(error));

      } catch (error) {
        reject(new Error(`Error al generar reporte: ${error.message}`));
      }
    });
  }
}
