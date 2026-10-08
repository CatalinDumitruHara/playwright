package com.mapfre.product.batch.documents;

import com.mapfre.product.batch.documents.pdf.ComprobanteDatosIncompletosException;
import com.mapfre.product.batch.documents.pdf.ComprobanteEstadoNoAprobadoException;
import com.mapfre.product.batch.documents.pdf.ComprobanteProperties;
import com.mapfre.product.batch.documents.pdf.ComprobanteVacacionesData;
import com.mapfre.product.batch.documents.pdf.DocumentoPdf;
import com.mapfre.product.batch.documents.pdf.NombreFicheroComprobante;
import com.mapfre.product.batch.documents.pdf.PdfGeneracionException;
import com.mapfre.product.batch.documents.pdf.PdfRenderer;
import com.mapfre.product.batch.documents.pdf.PlantillaDocPdfGeneric;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Genera el comprobante PDF de vacaciones aprobadas (COMMS-DOC-01, REQ-026, REQ-027)
 * con la plantilla {@code doc_pdf_generic}.
 */
@Service
public class DocumentoService {

    /** Estado de catálogo {@code request_status} requerido (se compara sin distinguir mayúsculas). */
    public static final String ESTADO_APROBADA = "Aprobada";

    /** Título del comprobante. */
    public static final String TITULO = "Comprobante de Vacaciones Aprobadas";

    private static final List<String> CAMPOS_OBLIGATORIOS = List.of("referencia", "employee_full_name",
            "request_start_date", "request_end_date", "approval_date", "company_name", "manager_full_name");

    private static final Logger log = LoggerFactory.getLogger(DocumentoService.class);

    private final PdfRenderer pdfRenderer;
    private final ComprobanteProperties properties;

    public DocumentoService(PdfRenderer pdfRenderer, ComprobanteProperties properties) {
        this.pdfRenderer = pdfRenderer;
        this.properties = properties;
    }

    /**
     * Genera el comprobante de vacaciones aprobadas.
     *
     * @param data datos de la solicitud
     * @return documento PDF con nombre REQ-026
     * @throws ComprobanteDatosIncompletosException si falta algún dato obligatorio
     * @throws ComprobanteEstadoNoAprobadoException si la solicitud no está 'Aprobada'
     * @throws PdfGeneracionException               si fallan todos los intentos de generación
     */
    public DocumentoPdf generarComprobanteVacaciones(ComprobanteVacacionesData data) {
        validar(data);
        if (data.statusName() == null || !ESTADO_APROBADA.equalsIgnoreCase(data.statusName().strip())) {
            throw new ComprobanteEstadoNoAprobadoException(data.referencia(), data.statusName());
        }

        String xhtml = PlantillaDocPdfGeneric.renderizar(
                TITULO,
                data.referencia(),
                fecha(data.approvalDate().toLocalDate()),
                cuerpo(data),
                properties.pieLegal());

        byte[] pdf = renderizarConReintentos(xhtml, data.referencia());
        DocumentoPdf documento = new DocumentoPdf(
                NombreFicheroComprobante.de(data.employeeFullName(), data.requestStartDate()), pdf);
        log.info("Comprobante de vacaciones generado: referencia={}, bytes={}", data.referencia(), pdf.length);
        return documento;
    }

    private void validar(ComprobanteVacacionesData data) {
        if (data == null) {
            throw new ComprobanteDatosIncompletosException(CAMPOS_OBLIGATORIOS);
        }
        List<String> faltan = new ArrayList<>();
        if (vacio(data.referencia())) {
            faltan.add("referencia");
        }
        if (vacio(data.employeeFullName())) {
            faltan.add("employee_full_name");
        }
        if (data.requestStartDate() == null) {
            faltan.add("request_start_date");
        }
        if (data.requestEndDate() == null) {
            faltan.add("request_end_date");
        }
        if (data.approvalDate() == null) {
            faltan.add("approval_date");
        }
        if (vacio(properties.companyName())) {
            faltan.add("company_name");
        }
        if (vacio(data.managerFullName())) {
            faltan.add("manager_full_name");
        }
        if (!faltan.isEmpty()) {
            throw new ComprobanteDatosIncompletosException(faltan);
        }
    }

    private String cuerpo(ComprobanteVacacionesData data) {
        return linea("Empresa", properties.companyName())
                + linea("Empleado", data.employeeFullName())
                + linea("Fecha de inicio", fecha(data.requestStartDate()))
                + linea("Fecha de fin", fecha(data.requestEndDate()))
                + linea("Fecha de aprobación", fecha(data.approvalDate().toLocalDate()))
                + linea("Aprobado por", data.managerFullName());
    }

    private byte[] renderizarConReintentos(String xhtml, String referencia) {
        int maxIntentos = Math.max(1, properties.maxIntentos());
        PdfGeneracionException ultimo = null;
        for (int intento = 1; intento <= maxIntentos; intento++) {
            try {
                return pdfRenderer.renderizar(xhtml);
            } catch (PdfGeneracionException e) {
                ultimo = e;
                log.warn("Fallo generando comprobante PDF: referencia={}, intento {}/{}",
                        referencia, intento, maxIntentos);
            }
        }
        log.error("ALERTA_SOPORTE: no se pudo generar el comprobante PDF tras {} intentos: referencia={}",
                maxIntentos, referencia);
        throw ultimo;
    }

    private static String linea(String etiqueta, String valor) {
        return "<p>" + PlantillaDocPdfGeneric.escapar(etiqueta) + ": "
                + PlantillaDocPdfGeneric.escapar(valor) + "</p>";
    }

    private static String fecha(LocalDate fecha) {
        return DateTimeFormatter.ISO_LOCAL_DATE.format(fecha);
    }

    private static boolean vacio(String valor) {
        return valor == null || valor.isBlank();
    }
}
