package com.mapfre.product.batch.documents;

import com.mapfre.product.batch.documents.pdf.ComprobanteDatosIncompletosException;
import com.mapfre.product.batch.documents.pdf.ComprobanteEstadoNoAprobadoException;
import com.mapfre.product.batch.documents.pdf.ComprobanteProperties;
import com.mapfre.product.batch.documents.pdf.ComprobanteVacacionesData;
import com.mapfre.product.batch.documents.pdf.DocumentoPdf;
import com.mapfre.product.batch.documents.pdf.PdfGeneracionException;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

    /** COMMS-DOC-01: solo se genera para solicitudes en estado 'Aprobada'. */
    @Test
    void fallaSiNoEstaAprobada() {
        ComprobanteVacacionesData v = datosValidos();
        ComprobanteVacacionesData pendiente = new ComprobanteVacacionesData(v.referencia(), "Pendiente",
                v.employeeFullName(), v.requestStartDate(), v.requestEndDate(), v.approvalDate(),
                v.managerFullName());

        assertThatThrownBy(() -> service.generarComprobanteVacaciones(pendiente))
                .isInstanceOf(ComprobanteEstadoNoAprobadoException.class);
    }

    /** REQ-027: faltan datos obligatorios del empleado / fechas. */
    @Test
    void fallaSiFaltanDatosObligatorios() {
        ComprobanteVacacionesData v = datosValidos();
        ComprobanteVacacionesData incompletos = new ComprobanteVacacionesData(v.referencia(), v.statusName(),
                null, v.requestStartDate(), null, v.approvalDate(), v.managerFullName());

        assertThatThrownBy(() -> service.generarComprobanteVacaciones(incompletos))
                .isInstanceOfSatisfying(ComprobanteDatosIncompletosException.class, e ->
                        assertThat(e.getCamposFaltantes())
                                .contains("employee_full_name", "request_end_date"));
    }

    /** REQ-027: el nombre de la empresa es obligatorio. */
    @Test
    void fallaSiFaltaNombreEmpresa() {
        DocumentoService sinEmpresa = new DocumentoService(new PdfRenderer(),
                new ComprobanteProperties("  ", "Pie legal de prueba", 2));

        assertThatThrownBy(() -> sinEmpresa.generarComprobanteVacaciones(datosValidos()))
                .isInstanceOfSatisfying(ComprobanteDatosIncompletosException.class, e ->
                        assertThat(e.getCamposFaltantes()).contains("company_name"));
    }

    /** COMMS-DOC-01: reintento ante fallo transitorio de generación. */
    @Test
    void reintentaYRecuperaTrasFalloTransitorio() {
        PdfRenderer renderer = mock(PdfRenderer.class);
        byte[] bytes = "%PDF-1.4".getBytes(StandardCharsets.US_ASCII);
        when(renderer.renderizar(anyString()))
                .thenThrow(new PdfGeneracionException("x", null))
                .thenReturn(bytes);
        DocumentoService conMock = new DocumentoService(renderer,
                new ComprobanteProperties("MAPFRE", "Pie legal de prueba", 2));

        DocumentoPdf pdf = conMock.generarComprobanteVacaciones(datosValidos());

        assertThat(pdf.contenido()).isEqualTo(bytes);
        verify(renderer, times(2)).renderizar(anyString());
    }

    /** COMMS-DOC-01: tras agotar los reintentos se propaga el error (y se alerta a soporte). */
    @Test
    void propagaErrorTrasAgotarReintentos() {
        PdfRenderer renderer = mock(PdfRenderer.class);
        when(renderer.renderizar(anyString())).thenThrow(new PdfGeneracionException("x", null));
        DocumentoService conMock = new DocumentoService(renderer,
                new ComprobanteProperties("MAPFRE", "Pie legal de prueba", 2));

        assertThatThrownBy(() -> conMock.generarComprobanteVacaciones(datosValidos()))
                .isInstanceOf(PdfGeneracionException.class);
        verify(renderer, times(2)).renderizar(anyString());
    }
}
