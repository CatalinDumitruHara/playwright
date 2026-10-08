package com.mapfre.product.batch.documents.pdf;

/**
 * La solicitud no está en estado 'Aprobada'; no se genera comprobante (COMMS-DOC-01).
 */
public class ComprobanteEstadoNoAprobadoException extends RuntimeException {

    public ComprobanteEstadoNoAprobadoException(String referencia, String statusName) {
        super("La solicitud " + referencia + " no está en estado 'Aprobada' (estado: " + statusName + ")");
    }
}
