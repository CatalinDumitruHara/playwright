package com.mapfre.product.microservice.users;

import com.mapfre.product.microservice.users.dto.UserCreateRequest;
import com.mapfre.product.microservice.users.dto.UserDetail;
import com.mapfre.product.microservice.users.dto.UserList;
import com.mapfre.product.microservice.users.dto.UserStatusUpdateRequest;
import com.mapfre.product.microservice.users.dto.UserSummary;
import com.mapfre.product.microservice.users.dto.UserUpdateRequest;
import com.mapfre.product.microservice.users.error.AutoDesactivacionError;
import com.mapfre.product.microservice.users.error.EmailDuplicadoError;
import com.mapfre.product.microservice.users.error.EstadoCuentaError;
import com.mapfre.product.microservice.users.error.RolInvalidoError;
import com.mapfre.product.microservice.users.error.UsuarioNoEncontradoError;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso de administración de usuarios.
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private static final int TEMP_PASSWORD_LENGTH = 16;
    private static final String TEMP_PASSWORD_ALPHABET =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?";

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public UserService(UserRepository userRepository, UserRoleRepository userRoleRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UserList list(String userRole, String status, int page, int size) {
        Specification<User> spec = (root, query, cb) -> cb.conjunction();
        if (userRole != null && !userRole.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("role").get("roleName"), userRole));
        }
        if (status != null && !status.isBlank()) {
            String isActive = UserStatus.toDb(status);
            spec = spec.and((root, query, cb) -> cb.equal(root.get("isActive"), isActive));
        }
        PageRequest pageable = PageRequest.of(page - 1, size, Sort.by("fullName").ascending());
        Page<User> result = userRepository.findAll(spec, pageable);
        List<UserSummary> items = result.getContent().stream().map(UserService::toSummary).toList();
        return new UserList(items, (int) result.getTotalElements(), page, size);
    }

    @Transactional(readOnly = true)
    public UserDetail get(String userId) {
        return toDetail(load(userId));
    }

    @Transactional
    public UserDetail create(UserCreateRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new EmailDuplicadoError();
        }
        UserRole role = resolveRole(request.userRole());
        String rawPassword = request.initialPassword() != null && !request.initialPassword().isBlank()
                ? request.initialPassword()
                : temporaryPassword();
        OffsetDateTime now = OffsetDateTime.now();

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setIsActive(UserStatus.DB_ACTIVE);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        User saved = userRepository.save(user);
        log.info("Usuario creado id={} rol={}", saved.getId(), role.getRoleName());
        return toDetail(saved);
    }

    @Transactional
    public UserDetail update(String userId, UserUpdateRequest request) {
        User user = load(userId);
        UserRole role = resolveRole(request.userRole());
        user.setFullName(request.fullName());
        user.setRole(role);
        user.setUpdatedAt(OffsetDateTime.now());
        User saved = userRepository.save(user);
        log.info("Usuario modificado id={} rol={}", saved.getId(), role.getRoleName());
        return toDetail(saved);
    }

    @Transactional
    public UserDetail updateStatus(String userId, UserStatusUpdateRequest request, String actorEmail) {
        User user = load(userId);
        String target = UserStatus.toDb(request.status());
        if (UserStatus.DB_INACTIVE.equals(target) && actorEmail != null
                && actorEmail.equalsIgnoreCase(user.getEmail())) {
            log.warn("Intento de auto-desactivación rechazado id={}", user.getId());
            throw new AutoDesactivacionError();
        }
        if (target.equals(user.getIsActive())) {
            throw new EstadoCuentaError();
        }
        user.setIsActive(target);
        user.setUpdatedAt(OffsetDateTime.now());
        User saved = userRepository.save(user);
        log.info("Estado de usuario cambiado id={} status={}", saved.getId(), request.status());
        return toDetail(saved);
    }

    private User load(String userId) {
        Long id = UserIdCodec.decode(userId).orElseThrow(UsuarioNoEncontradoError::new);
        return userRepository.findById(id).orElseThrow(UsuarioNoEncontradoError::new);
    }

    private UserRole resolveRole(String roleName) {
        return userRoleRepository.findByRoleName(roleName).orElseThrow(RolInvalidoError::new);
    }

    private String temporaryPassword() {
        StringBuilder sb = new StringBuilder(TEMP_PASSWORD_LENGTH);
        for (int i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
            sb.append(TEMP_PASSWORD_ALPHABET.charAt(secureRandom.nextInt(TEMP_PASSWORD_ALPHABET.length())));
        }
        return sb.toString();
    }

    private static UserSummary toSummary(User user) {
        return new UserSummary(
                UserIdCodec.encode(user.getId()),
                user.getFullName(),
                user.getEmail(),
                user.getRole().getRoleName(),
                UserStatus.toApi(user.getIsActive()));
    }

    private static UserDetail toDetail(User user) {
        return new UserDetail(
                UserIdCodec.encode(user.getId()),
                user.getFullName(),
                user.getEmail(),
                user.getRole().getRoleName(),
                UserStatus.toApi(user.getIsActive()),
                user.getManager() != null ? user.getManager().getFullName() : null);
    }
}
