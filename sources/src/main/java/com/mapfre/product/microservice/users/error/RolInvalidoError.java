package com.mapfre.product.microservice.users.error;

public class RolInvalidoError extends RuntimeException {

    public static final String DEFAULT_MESSAGE = "El rol seleccionado no es válido.";

    public RolInvalidoError() {
        super(DEFAULT_MESSAGE);
    }

    public RolInvalidoError(String message) {
        super(message);
    }
}
