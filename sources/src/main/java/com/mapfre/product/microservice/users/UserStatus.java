package com.mapfre.product.microservice.users;

/**
 * Traducción entre {@code status} del API ('Activo'|'Inactivo') e {@code is_active} ('Y'|'N').
 */
public final class UserStatus {

    public static final String ACTIVO = "Activo";
    public static final String INACTIVO = "Inactivo";
    public static final String DB_ACTIVE = "Y";
    public static final String DB_INACTIVE = "N";

    private UserStatus() {
    }

    public static String toApi(String isActive) {
        return DB_ACTIVE.equals(isActive) ? ACTIVO : INACTIVO;
    }

    public static String toDb(String status) {
        if (ACTIVO.equals(status)) {
            return DB_ACTIVE;
        }
        if (INACTIVO.equals(status)) {
            return DB_INACTIVE;
        }
        throw new IllegalArgumentException("Estado no válido: " + status);
    }
}
