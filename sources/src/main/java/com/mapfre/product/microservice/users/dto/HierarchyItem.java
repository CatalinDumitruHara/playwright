package com.mapfre.product.microservice.users.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;

public record HierarchyItem(
        @JsonProperty("employee_id") UUID employeeId,
        @JsonProperty("employee_name") String employeeName,
        @JsonProperty("employee_email") String employeeEmail,
        @JsonProperty("manager_id") UUID managerId,
        @JsonProperty("manager_name") String managerName) {
}
