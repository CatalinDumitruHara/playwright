package com.mapfre.product.microservice.users.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
        @JsonProperty("full_name") @NotBlank @Size(max = 255) String fullName,
        @JsonProperty("email") @NotBlank @Size(max = 255)
        @Email(regexp = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$") String email,
        @JsonProperty("user_role") @NotBlank
        @Pattern(regexp = "EMPLEADO|MANAGER", message = "debe ser EMPLEADO o MANAGER") String userRole,
        @JsonProperty("initial_password") @Size(max = 255) String initialPassword) {
}
