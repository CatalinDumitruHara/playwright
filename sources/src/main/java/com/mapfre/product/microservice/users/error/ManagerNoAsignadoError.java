package com.mapfre.product.microservice.users.error;

public class ManagerNoAsignadoError extends RuntimeException {

    public static final String DEFAULT_MESSAGE = "El empleado no tiene un manager asignado.";

    public ManagerNoAsignadoError() {
        super(DEFAULT_MESSAGE);
    }

    public ManagerNoAsignadoError(String message) {
        super(message);
    }
}
