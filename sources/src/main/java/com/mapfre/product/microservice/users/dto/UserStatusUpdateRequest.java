package com.mapfre.product.microservice.users.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UserStatusUpdateRequest(
        @JsonProperty("status") @NotBlank
        @Pattern(regexp = "Activo|Inactivo", message = "debe ser Activo o Inactivo") String status) {
}
