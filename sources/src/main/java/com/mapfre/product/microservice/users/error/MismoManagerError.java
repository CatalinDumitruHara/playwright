package com.mapfre.product.microservice.users.error;

public class MismoManagerError extends RuntimeException {

    public static final String DEFAULT_MESSAGE = "El nuevo manager es el mismo que el actualmente asignado.";

    public MismoManagerError() {
        super(DEFAULT_MESSAGE);
    }

    public MismoManagerError(String message) {
        super(message);
    }
}
