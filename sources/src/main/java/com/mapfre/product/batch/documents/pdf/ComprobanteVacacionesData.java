package com.mapfre.product.batch.documents.pdf;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Datos de entrada del comprobante de vacaciones aprobadas (REQ-027, COMMS-DOC-01).
 *
 * @param referencia       identificador de la solicitud (p. ej. UUID de la solicitud de vacaciones)
 * @param statusName       valor de catálogo {@code request_status.status_name} (p. ej. "Aprobada")
 * @param employeeFullName nombre completo del empleado ({@code employee_full_name})
 * @param requestStartDate fecha de inicio de las vacaciones ({@code request_start_date})
 * @param requestEndDate   fecha de fin de las vacaciones ({@code request_end_date})
 * @param approvalDate     fecha de aprobación ({@code approval_date}), tomada de
 *                         {@code vacation_requests.resolution_date}; siempre con offset
 * @param managerFullName  nombre completo del responsable que aprueba
 */
public record ComprobanteVacacionesData(
        String referencia,
        String statusName,
        String employeeFullName,
        LocalDate requestStartDate,
        LocalDate requestEndDate,
        OffsetDateTime approvalDate,
        String managerFullName) {
}
