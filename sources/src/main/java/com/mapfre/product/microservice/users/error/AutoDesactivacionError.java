package com.mapfre.product.microservice.users.error;

public class AutoDesactivacionError extends RuntimeException {

    public static final String DEFAULT_MESSAGE = "Un administrador no puede desactivar su propia cuenta.";

    public AutoDesactivacionError() {
        super(DEFAULT_MESSAGE);
    }

    public AutoDesactivacionError(String message) {
        super(message);
    }
}
