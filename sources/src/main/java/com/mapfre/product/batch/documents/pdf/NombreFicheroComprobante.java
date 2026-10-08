package com.mapfre.product.batch.documents.pdf;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Construye el nombre de fichero del comprobante según REQ-026:
 * {@code Comprobante_Vacaciones_[nombre_empleado]_[fecha_inicio].pdf}.
 */
public final class NombreFicheroComprobante {

    private static final String PREFIJO = "Comprobante_Vacaciones_";
    private static final String EXTENSION = ".pdf";

    private NombreFicheroComprobante() {
    }

    /**
     * Genera el nombre del fichero.
     *
     * @param employeeFullName nombre completo del empleado (no vacío)
     * @param requestStartDate fecha de inicio de las vacaciones (no nula)
     * @return nombre de fichero, p. ej. {@code Comprobante_Vacaciones_Ana_García_López_2026-07-01.pdf}
     * @throws IllegalArgumentException si el nombre está vacío o la fecha es nula
     */
    public static String de(String employeeFullName, LocalDate requestStartDate) {
        if (employeeFullName == null || employeeFullName.isBlank()) {
            throw new IllegalArgumentException("employeeFullName es obligatorio");
        }
        if (requestStartDate == null) {
            throw new IllegalArgumentException("requestStartDate es obligatoria");
        }
        String nombre = employeeFullName
                .replaceAll("[/\\\\:*?\"<>|\\p{Cntrl}]", "")
                .strip()
                .replaceAll("\\s+", "_");
        if (nombre.isEmpty()) {
            throw new IllegalArgumentException("employeeFullName no contiene caracteres válidos");
        }
        return PREFIJO + nombre + "_" + DateTimeFormatter.ISO_LOCAL_DATE.format(requestStartDate) + EXTENSION;
    }
}
