package com.mapfre.product.batch.documents.pdf;

import java.util.List;

/**
 * Faltan datos obligatorios para generar el comprobante de vacaciones (COMMS-DOC-01, REQ-027).
 */
public class ComprobanteDatosIncompletosException extends RuntimeException {

    private final List<String> camposFaltantes;

    /**
     * @param camposFaltantes nombres REQ-027 de los campos obligatorios ausentes
     */
    public ComprobanteDatosIncompletosException(List<String> camposFaltantes) {
        super("Datos obligatorios incompletos para el comprobante: " + String.join(", ", camposFaltantes));
        this.camposFaltantes = List.copyOf(camposFaltantes);
    }

    /** Campos obligatorios ausentes (nombres REQ-027). */
    public List<String> getCamposFaltantes() {
        return camposFaltantes;
    }
}
