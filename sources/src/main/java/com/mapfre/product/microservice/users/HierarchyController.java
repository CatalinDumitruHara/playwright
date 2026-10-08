package com.mapfre.product.microservice.users;

import com.mapfre.product.microservice.users.dto.HierarchyList;
import com.mapfre.product.microservice.users.dto.HierarchyNodeDetail;
import com.mapfre.product.microservice.users.dto.ManagerAssignmentRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * API de gestión de jerarquía (EP-006..EP-009, rol ADMINISTRADOR vía SecurityConfig).
 * Paths literales del contrato; la base /api la añade Application.
 */
@RestController
@Validated
public class HierarchyController {

    private final UserService userService;

    public HierarchyController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/admin/hierarchy")
    public HierarchyList hierarchy(
            @RequestParam(name = "filter_by_manager", required = false) String filterByManager,
            @RequestParam(name = "filter_by_unassigned", required = false) Boolean filterByUnassigned,
            @RequestParam(name = "page", defaultValue = "1") @Min(1) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        return userService.hierarchy(filterByManager, filterByUnassigned, page, size);
    }

    @PostMapping("/admin/employees/{employeeId}/manager")
    public ResponseEntity<HierarchyNodeDetail> assignManager(@PathVariable("employeeId") String employeeId,
                                                             @Valid @RequestBody ManagerAssignmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.assignManager(employeeId, request));
    }

    @PutMapping("/admin/employees/{employeeId}/manager")
    public HierarchyNodeDetail changeManager(@PathVariable("employeeId") String employeeId,
                                             @Valid @RequestBody ManagerAssignmentRequest request) {
        return userService.changeManager(employeeId, request);
    }

    @DeleteMapping("/admin/employees/{employeeId}/manager")
    public ResponseEntity<Void> removeManager(@PathVariable("employeeId") String employeeId) {
        userService.removeManager(employeeId);
        return ResponseEntity.noContent().build();
    }
}
