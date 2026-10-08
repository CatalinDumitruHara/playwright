package com.mapfre.product.microservice.users;

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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * API de administración de usuarios (requiere rol ADMINISTRADOR, ver SecurityConfig).
 */
@RestController
@Validated
@RequestMapping("/api/admin/users")
public class UsuarioController {

    private final UserService userService;

    public UsuarioController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public UserList list(
            @RequestParam(name = "user_role", required = false)
            @Pattern(regexp = "EMPLEADO|MANAGER", message = "debe ser EMPLEADO o MANAGER") String userRole,
            @RequestParam(name = "status", required = false)
            @Pattern(regexp = "Activo|Inactivo", message = "debe ser Activo o Inactivo") String status,
            @RequestParam(name = "page", defaultValue = "1") @Min(1) int page,
            @RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(100) int size) {
        return userService.list(userRole, status, page, size);
    }

    @PostMapping
    public ResponseEntity<UserDetail> create(@Valid @RequestBody UserCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(request));
    }

    @GetMapping("/{userId}")
    public UserDetail get(@PathVariable("userId") String userId) {
        return userService.get(userId);
    }

    @PutMapping("/{userId}")
    public UserDetail update(@PathVariable("userId") String userId,
                             @Valid @RequestBody UserUpdateRequest request) {
        return userService.update(userId, request);
    }

    @PatchMapping("/{userId}/status")
    public UserDetail updateStatus(@PathVariable("userId") String userId,
                                   @Valid @RequestBody UserStatusUpdateRequest request,
                                   @AuthenticationPrincipal Jwt jwt) {
        String actorEmail = jwt != null ? jwt.getSubject() : null;
        return userService.updateStatus(userId, request, actorEmail);
    }
}
