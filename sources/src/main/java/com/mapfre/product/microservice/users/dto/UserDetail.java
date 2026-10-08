package com.mapfre.product.microservice.users.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;

public record UserDetail(
        @JsonProperty("user_id") UUID userId,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("email") String email,
        @JsonProperty("user_role") String userRole,
        @JsonProperty("status") String status,
        @JsonProperty("manager_name") @JsonInclude(JsonInclude.Include.NON_NULL) String managerName) {
}
