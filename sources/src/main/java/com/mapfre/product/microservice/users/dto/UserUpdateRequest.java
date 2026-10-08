package com.mapfre.product.microservice.users.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @JsonProperty("full_name") @NotBlank @Size(max = 255) String fullName,
        @JsonProperty("user_role") @NotBlank
        @Pattern(regexp = "EMPLEADO|MANAGER", message = "debe ser EMPLEADO o MANAGER") String userRole) {
}
