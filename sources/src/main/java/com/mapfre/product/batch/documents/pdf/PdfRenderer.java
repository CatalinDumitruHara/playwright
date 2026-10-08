package com.mapfre.product.batch.documents.pdf;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;

/**
 * Convierte XHTML bien formado en PDF con openhtmltopdf.
 */
@Component
public class PdfRenderer {

    private static final Logger log = LoggerFactory.getLogger(PdfRenderer.class);

    /**
     * Renderiza el XHTML a PDF.
     *
     * @param xhtml documento XHTML bien formado
     * @return bytes del PDF
     * @throws PdfGeneracionException si falla la generación
     */
    public byte[] renderizar(String xhtml) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(xhtml, null);
            builder.toStream(baos);
            builder.run();
            byte[] pdf = baos.toByteArray();
            log.debug("PDF generado ({} bytes)", pdf.length);
            return pdf;
        } catch (Exception e) {
            log.error("Error generando PDF: {}", e.getMessage());
            throw new PdfGeneracionException("Error generando PDF", e);
        }
    }
}
