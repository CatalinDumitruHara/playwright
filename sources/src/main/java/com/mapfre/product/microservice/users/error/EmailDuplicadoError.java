package com.mapfre.product.microservice.users.error;

public class EmailDuplicadoError extends RuntimeException {

    public static final String DEFAULT_MESSAGE = "El email proporcionado ya está en uso. Por favor, utilice otro.";

    public EmailDuplicadoError() {
        super(DEFAULT_MESSAGE);
    }

    public EmailDuplicadoError(String message) {
        super(message);
    }
}
