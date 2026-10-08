package com.mapfre.product.microservice.users;

import java.util.Optional;
import java.util.UUID;

/**
 * Codificación reversible entre {@code users.id} (NUMBER) y el {@code user_id} (uuid) del API:
 * {@code new UUID(0L, id)}.
 */
public final class UserIdCodec {

    private UserIdCodec() {
    }

    public static UUID encode(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("id must not be null");
        }
        return new UUID(0L, id);
    }

    public static Optional<Long> decode(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        UUID uuid;
        try {
            uuid = UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
        // UUID.fromString es laxo con el formato: exige la forma canónica re-serializada.
        if (!uuid.toString().equalsIgnoreCase(raw.trim())) {
            return Optional.empty();
        }
        if (uuid.getMostSignificantBits() != 0L) {
            return Optional.empty();
        }
        long id = uuid.getLeastSignificantBits();
        return id > 0 ? Optional.of(id) : Optional.empty();
    }
}
