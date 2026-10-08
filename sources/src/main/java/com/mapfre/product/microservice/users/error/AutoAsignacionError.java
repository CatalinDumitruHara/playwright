package com.mapfre.product.microservice.users.error;

public class AutoAsignacionError extends RuntimeException {

    public static final String DEFAULT_MESSAGE = "Un usuario no puede ser su propio manager.";

    public AutoAsignacionError() {
        super(DEFAULT_MESSAGE);
    }

    public AutoAsignacionError(String message) {
        super(message);
    }
}
