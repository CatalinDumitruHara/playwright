package com.mapfre.product.microservice.users.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record ManagerAssignmentRequest(
        @JsonProperty("manager_id") @NotBlank String managerId) {
}
