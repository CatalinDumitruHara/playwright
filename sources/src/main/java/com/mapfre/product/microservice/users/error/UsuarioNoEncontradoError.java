package com.mapfre.product.microservice.users.error;

public class UsuarioNoEncontradoError extends RuntimeException {

    public static final String DEFAULT_MESSAGE = "El usuario solicitado no existe.";

    public UsuarioNoEncontradoError() {
        super(DEFAULT_MESSAGE);
    }

    public UsuarioNoEncontradoError(String message) {
        super(message);
    }
}
