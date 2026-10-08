package com.mapfre.product.microservice.users.error;

public class EstadoCuentaError extends RuntimeException {

    public static final String DEFAULT_MESSAGE = "La cuenta ya se encuentra en el estado solicitado.";

    public EstadoCuentaError() {
        super(DEFAULT_MESSAGE);
    }

    public EstadoCuentaError(String message) {
        super(message);
    }
}
