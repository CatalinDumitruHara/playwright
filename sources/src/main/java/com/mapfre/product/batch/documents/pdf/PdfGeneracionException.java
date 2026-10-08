package com.mapfre.product.batch.documents.pdf;

/**
 * Error al generar un documento PDF.
 */
public class PdfGeneracionException extends RuntimeException {

    public PdfGeneracionException(String message, Throwable cause) {
        super(message, cause);
    }
}
