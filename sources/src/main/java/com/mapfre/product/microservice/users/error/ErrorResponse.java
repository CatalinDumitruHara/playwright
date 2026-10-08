package com.mapfre.product.microservice.users.error;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record ErrorResponse(
        @JsonProperty("code") String code,
        @JsonProperty("message") String message,
        @JsonProperty("details") List<String> details) {
}
