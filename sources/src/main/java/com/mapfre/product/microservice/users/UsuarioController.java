package com.mapfre.product.microservice.users;

import com.mapfre.product.microservice.users.dto.HierarchyList;
import com.mapfre.product.microservice.users.dto.HierarchyNodeDetail;
import com.mapfre.product.microservice.users.dto.ManagerAssignmentRequest;
import com.mapfre.product.microservice.users.dto.UserCreateRequest;
import com.mapfre.product.microservice.users.dto.UserDetail;
import com.mapfre.product.microservice.users.dto.UserList;
import com.mapfre.product.microservice.users.dto.UserStatusUpdateRequest;
import com.mapfre.product.microservice.users.dto.UserUpdateRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * API de administración de usuarios (requiere rol ADMINISTRADOR, ver SecurityConfig).
 * Paths literales del contrato (openapi.yaml); la base pública {@code /api}
 * (servers[0].url) la añade el composition root ({@code Application}).
 */
@RestController
@Validated
public class UsuarioController {

    private final UserService userService;

    public UsuarioController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/admin/users")
    public UserList list(
            @RequestParam(name = "user_role", required = false)
            @Pattern(regexp = "EMPLEADO|MANAGER", message = "debe ser EMPLEADO o MANAGER") String userRole,
            @RequestParam(name = "status", required = false)
            @Pattern(regexp = "Activo|Inactivo", message = "debe ser Activo o Inactivo") String status,
            @RequestParam(name = "page", defaultValue = "1") @Min(1) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        return userService.list(userRole, status, page, size);
    }

    @PostMapping("/admin/users")
    public ResponseEntity<UserDetail> create(@Valid @RequestBody UserCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(request));
    }

    @GetMapping("/admin/users/{userId}")
    public UserDetail get(@PathVariable("userId") String userId) {
        return userService.get(userId);
    }

    @PutMapping("/admin/users/{userId}")
    public UserDetail update(@PathVariable("userId") String userId,
                             @Valid @RequestBody UserUpdateRequest request) {
        return userService.update(userId, request);
    }

    @PatchMapping("/admin/users/{userId}/status")
    public UserDetail updateStatus(@PathVariable("userId") String userId,
                                   @Valid @RequestBody UserStatusUpdateRequest request,
                                   @AuthenticationPrincipal Jwt jwt) {
        String actorEmail = jwt != null ? jwt.getSubject() : null;
        return userService.updateStatus(userId, request, actorEmail);
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
