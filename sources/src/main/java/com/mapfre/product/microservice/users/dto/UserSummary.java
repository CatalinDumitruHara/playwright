package com.mapfre.product.microservice.users.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;

public record UserSummary(
        @JsonProperty("user_id") UUID userId,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("email") String email,
        @JsonProperty("user_role") String userRole,
        @JsonProperty("status") String status) {
}
