/* =========================================================
   Tests interactivos ASIR — pdf-report.js
   Generación del reporte PDF con jsPDF
   ========================================================= */

/* global window */

function generatePDF({ moduleName, typeName, total, aciertos, fallos, blancos, nota, wrongAnswers }) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const PW     = 210;
    const PH     = 297;
    const MARGIN = 18;
    const CW     = PW - MARGIN * 2;  // ancho del contenido: 174mm

    const now     = new Date();
    const fecha   = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora    = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    let y = 0;

    // ================================================================
    // Cabecera
    // ================================================================
    doc.setFillColor(5, 20, 5);
    doc.rect(0, 0, PW, 36, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 220, 60);
    doc.text('REPORTE DE RESULTADO DEL TEST', MARGIN, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 180, 80);
    doc.text('Tests interactivos ASIR', MARGIN, 22);
    doc.text(`${fecha}  ${hora}`, PW - MARGIN, 22, { align: 'right' });

    // Línea inferior de cabecera
    doc.setDrawColor(0, 200, 50);
    doc.setLineWidth(0.4);
    doc.line(0, 36, PW, 36);

    y = 48;

    // ================================================================
    // Bloque: información del test
    // ================================================================
    _seccionTitulo(doc, 'INFORMACION DEL TEST', MARGIN, y, CW);
    y += 10;

    const infoRows = [
        ['Modulo',     moduleName],
        ['Tipo',       typeName],
        ['Fecha',      `${fecha} a las ${hora}`],
    ];

    doc.setFontSize(9);
    infoRows.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(label + ':', MARGIN, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(value, MARGIN + 28, y);
        y += 6.5;
    });

    y += 6;

    // ================================================================
    // Bloque: estadísticas (4 cajas)
    // ================================================================
    _seccionTitulo(doc, 'ESTADISTICAS', MARGIN, y, CW);
    y += 10;

    const cajas = [
        { label: 'TOTAL',     valor: String(total),    r: 30,  g: 30,  b: 30  },
        { label: 'ACIERTOS',  valor: String(aciertos), r: 0,   g: 160, b: 40  },
        { label: 'FALLOS',    valor: String(fallos),   r: 200, g: 0,   b: 40  },
        { label: 'EN BLANCO', valor: String(blancos),  r: 160, g: 120, b: 0   },
    ];

    const cajaW = (CW - 6) / 4;  // 4 cajas con 2mm de hueco entre ellas
    cajas.forEach(({ label, valor, r, g, b }, i) => {
        const cx = MARGIN + i * (cajaW + 2);
        doc.setFillColor(245, 248, 245);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.rect(cx, y, cajaW, 20, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(label, cx + cajaW / 2, y + 6, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(r, g, b);
        doc.text(valor, cx + cajaW / 2, y + 16, { align: 'center' });
    });

    y += 24;

    // Caja de nota final (ancho completo)
    doc.setFillColor(5, 20, 5);
    doc.setDrawColor(0, 200, 50);
    doc.setLineWidth(0.4);
    doc.rect(MARGIN, y, CW, 18, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 180, 80);
    doc.text('NOTA FINAL', MARGIN + 6, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(0, 230, 60);
    doc.text(`${nota.toFixed(2)} / 10`, PW - MARGIN - 6, y + 13, { align: 'right' });

    y += 26;

    // ================================================================
    // Bloque: preguntas falladas
    // ================================================================
    if (wrongAnswers.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(80, 140, 80);
        doc.text('Sin preguntas falladas. ¡Excelente resultado!', MARGIN, y);
    } else {
        _seccionTitulo(doc, `PREGUNTAS FALLADAS (${wrongAnswers.length})`, MARGIN, y, CW, [180, 0, 40]);
        y += 10;

        wrongAnswers.forEach(({ q, i, ans }, idx) => {
            // Calcular altura aproximada del bloque antes de dibujarlo
            const pregLines  = doc.splitTextToSize(`${String(i + 1).padStart(2, '0')}. ${q.question}`, CW - 4);
            const tuaLines   = doc.splitTextToSize(q.options[ans], CW - 32);
            const corrLines  = doc.splitTextToSize(q.options[q.correctAnswer], CW - 32);
            const alturaBloque = pregLines.length * 4.5 + tuaLines.length * 4 + corrLines.length * 4 + 14;

            if (y + alturaBloque > PH - 18) {
                doc.addPage();
                y = 18;
            }

            // Fondo suave del bloque
            doc.setFillColor(255, 250, 250);
            doc.setDrawColor(220, 180, 180);
            doc.setLineWidth(0.15);
            doc.rect(MARGIN, y, CW, alturaBloque - 3, 'FD');

            y += 4;

            // Texto de la pregunta
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(180, 0, 40);
            doc.text(pregLines, MARGIN + 3, y);
            y += pregLines.length * 4.5 + 2;

            // Tu respuesta
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(180, 0, 40);
            doc.text('Tu respuesta:', MARGIN + 5, y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(140, 0, 30);
            doc.text(tuaLines, MARGIN + 32, y);
            y += tuaLines.length * 4 + 2;

            // Respuesta correcta
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(0, 140, 30);
            doc.text('Correcta:', MARGIN + 5, y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 120, 20);
            doc.text(corrLines, MARGIN + 32, y);
            y += corrLines.length * 4 + 6;
        });
    }

    // ================================================================
    // Pie de página en todas las páginas
    // ================================================================
    const totalPags = doc.getNumberOfPages();
    for (let p = 1; p <= totalPags; p++) {
        doc.setPage(p);
        doc.setFillColor(235, 235, 235);
        doc.rect(0, PH - 10, PW, 10, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(140, 140, 140);
        doc.text('Tests interactivos ASIR — Plataforma de practica', MARGIN, PH - 4);
        doc.text(`Pag. ${p} / ${totalPags}`, PW - MARGIN, PH - 4, { align: 'right' });
    }

    // Guardar
    const slug     = typeName === 'Simulacro aleatorio' ? 'simulacro' : 'global';
    const filename = `reporte_${moduleName.toLowerCase()}_${slug}_${fecha.replace(/\//g, '-')}.pdf`;
    doc.save(filename);
}

// ================================================================
// Helpers internos
// ================================================================
function _seccionTitulo(doc, texto, x, y, ancho, color = [0, 150, 40]) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...color);
    doc.text(texto, x, y);
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(x, y + 2, x + ancho, y + 2);
}
