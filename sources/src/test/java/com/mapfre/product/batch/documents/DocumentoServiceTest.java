package com.mapfre.product.batch.documents;

import com.mapfre.product.batch.documents.pdf.ComprobanteProperties;
import com.mapfre.product.batch.documents.pdf.ComprobanteVacacionesData;
import com.mapfre.product.batch.documents.pdf.DocumentoPdf;
import com.mapfre.product.batch.documents.pdf.PdfRenderer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class DocumentoServiceTest {

    private DocumentoService service;

    @BeforeEach
    void setUp() {
        service = new DocumentoService(new PdfRenderer(),
                new ComprobanteProperties("MAPFRE", "Pie legal de prueba", 2));
    }

    private static ComprobanteVacacionesData datosValidos() {
        return new ComprobanteVacacionesData(
                "b3f1c2d4-0000-4000-8000-000000000001",
                "Aprobada",
                "Ana García López",
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 7, 15),
                OffsetDateTime.of(2026, 6, 20, 10, 30, 0, 0, ZoneOffset.ofHours(2)),
                "Luis Pérez");
    }

    private static String texto(byte[] pdf) throws IOException {
        try (PDDocument doc = PDDocument.load(pdf)) {
            return new PDFTextStripper().getText(doc);
        }
    }

    /** REQ-027: el PDF contiene todos los datos obligatorios. */
    @Test
    void generaPdfConDatosObligatoriosREQ027() throws IOException {
        DocumentoPdf pdf = service.generarComprobanteVacaciones(datosValidos());

        byte[] bytes = pdf.contenido();
        assertThat(new String(bytes, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");

        String texto = texto(bytes);
        assertThat(texto)
                .contains("Ana García López")
                .contains("2026-07-01")
                .contains("2026-07-15")
                .contains("2026-06-20")
                .contains("MAPFRE")
                .contains("Comprobante de Vacaciones Aprobadas")
                .contains("Luis Pérez");
    }

    /** REQ-026: nombre de fichero Comprobante_Vacaciones_[nombre_empleado]_[fecha_inicio].pdf. */
    @Test
    void nombreFicheroSigueConvencionREQ026() throws IOException {
        DocumentoPdf pdf = service.generarComprobanteVacaciones(datosValidos());

        assertThat(pdf.nombreFichero())
                .isEqualTo("Comprobante_Vacaciones_Ana_García_López_2026-07-01.pdf");
        try (InputStream in = pdf.abrirStream()) {
            assertThat(in.readAllBytes()).isEqualTo(pdf.contenido());
        }
    }

    /** COMMS-DOC-01: el stream devuelto es un PDF legible. */
    @Test
    void streamEsPdfLegible() throws IOException {
        DocumentoPdf pdf = service.generarComprobanteVacaciones(datosValidos());

        try (InputStream in = pdf.abrirStream(); PDDocument doc = PDDocument.load(in)) {
            assertThat(doc.getNumberOfPages()).isGreaterThanOrEqualTo(1);
        }
    }
}
