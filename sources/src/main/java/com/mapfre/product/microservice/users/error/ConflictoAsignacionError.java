package com.mapfre.product.microservice.users.error;

public class ConflictoAsignacionError extends RuntimeException {

    public static final String DEFAULT_MESSAGE = "El empleado ya tiene un manager asignado. Utilice la modificación de manager.";

    public ConflictoAsignacionError() {
        super(DEFAULT_MESSAGE);
    }

    public ConflictoAsignacionError(String message) {
        super(message);
    }
}
