package com.mapfre.product.microservice.users;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mapfre.product.microservice.users.dto.UserCreateRequest;
import com.mapfre.product.microservice.users.dto.UserDetail;
import com.mapfre.product.microservice.users.dto.UserStatusUpdateRequest;
import com.mapfre.product.microservice.users.error.AutoDesactivacionError;
import com.mapfre.product.microservice.users.error.EmailDuplicadoError;
import com.mapfre.product.microservice.users.error.EstadoCuentaError;
import com.mapfre.product.microservice.users.error.RolInvalidoError;
import com.mapfre.product.microservice.users.error.UsuarioNoEncontradoError;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    private static final String ADMIN_EMAIL = "admin@mapfre.com";

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private static UserRole role(long id, String name) {
        UserRole r = new UserRole();
        r.setId(id);
        r.setRoleName(name);
        return r;
    }

    private static User user(long id, String email, String isActive) {
        User u = new User();
        u.setId(id);
        u.setFullName("Usuario " + id);
        u.setEmail(email);
        u.setPasswordHash("$2a$10$hash");
        u.setRole(role(1L, "EMPLEADO"));
        u.setIsActive(isActive);
        u.setCreatedAt(OffsetDateTime.now().minusDays(1));
        u.setUpdatedAt(OffsetDateTime.now().minusDays(1));
        return u;
    }

    private void saveReturnsWithId(long id) {
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            if (u.getId() == null) {
                u.setId(id);
            }
            return u;
        });
    }

    @Test
    @DisplayName("UT-010: crear con datos válidos y email inexistente guarda usuario activo con hash y devuelve status Activo")
    void ut010_createValidUser() {
        UserCreateRequest req = new UserCreateRequest("Ana Pérez", "ana@mapfre.com", "EMPLEADO", "Secreta123!");
        when(userRepository.existsByEmailIgnoreCase("ana@mapfre.com")).thenReturn(false);
        when(userRoleRepository.findByRoleName("EMPLEADO")).thenReturn(Optional.of(role(1L, "EMPLEADO")));
        when(passwordEncoder.encode("Secreta123!")).thenReturn("$2a$10$encoded");
        saveReturnsWithId(42L);

        UserDetail detail = userService.create(req);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getIsActive()).isEqualTo("Y");
        assertThat(saved.getPasswordHash()).isEqualTo("$2a$10$encoded").isNotEqualTo("Secreta123!");
        assertThat(saved.getEmail()).isEqualTo("ana@mapfre.com");
        assertThat(saved.getFullName()).isEqualTo("Ana Pérez");
        assertThat(saved.getRole().getRoleName()).isEqualTo("EMPLEADO");
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();

        assertThat(detail.status()).isEqualTo("Activo");
        assertThat(detail.userId()).isEqualTo(UserIdCodec.encode(42L));
        assertThat(detail.userRole()).isEqualTo("EMPLEADO");
    }

    @Test
    @DisplayName("UT-010 (variante): sin initial_password se genera contraseña temporal de 16 chars y se guarda codificada")
    void ut010_createWithoutInitialPassword() {
        UserCreateRequest req = new UserCreateRequest("Luis Gómez", "luis@mapfre.com", "MANAGER", null);
        when(userRepository.existsByEmailIgnoreCase("luis@mapfre.com")).thenReturn(false);
        when(userRoleRepository.findByRoleName("MANAGER")).thenReturn(Optional.of(role(2L, "MANAGER")));
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$temp");
        saveReturnsWithId(43L);

        UserDetail detail = userService.create(req);

        ArgumentCaptor<String> raw = ArgumentCaptor.forClass(String.class);
        verify(passwordEncoder).encode(raw.capture());
        assertThat(raw.getValue()).hasSize(16);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("$2a$10$temp").isNotEqualTo(raw.getValue());
        assertThat(captor.getValue().getIsActive()).isEqualTo("Y");
        assertThat(detail.status()).isEqualTo("Activo");
    }

    @Test
    @DisplayName("UT-011: email existente lanza EmailDuplicadoError y no se guarda")
    void ut011_duplicateEmail() {
        UserCreateRequest req = new UserCreateRequest("Ana Pérez", "ana@mapfre.com", "EMPLEADO", "x");
        when(userRepository.existsByEmailIgnoreCase("ana@mapfre.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.create(req))
                .isInstanceOf(EmailDuplicadoError.class)
                .hasMessage(EmailDuplicadoError.DEFAULT_MESSAGE);
        verify(userRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    @DisplayName("UT-012: desactivar cuenta activa de otro usuario pasa isActive a N y devuelve status Inactivo")
    void ut012_deactivateOtherUser() {
        User target = user(7L, "pepe@mapfre.com", "Y");
        when(userRepository.findById(7L)).thenReturn(Optional.of(target));
        saveReturnsWithId(7L);

        UserDetail detail = userService.updateStatus(UserIdCodec.encode(7L).toString(),
                new UserStatusUpdateRequest("Inactivo"), ADMIN_EMAIL);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getIsActive()).isEqualTo("N");
        assertThat(detail.status()).isEqualTo("Inactivo");
        assertThat(detail.userId()).isEqualTo(UserIdCodec.encode(7L));
    }

    @Test
    @DisplayName("UT-013: admin que desactiva su propia cuenta recibe AutoDesactivacionError sin cambios")
    void ut013_selfDeactivation() {
        User self = user(1L, ADMIN_EMAIL, "Y");
        when(userRepository.findById(1L)).thenReturn(Optional.of(self));

        assertThatThrownBy(() -> userService.updateStatus(UserIdCodec.encode(1L).toString(),
                new UserStatusUpdateRequest("Inactivo"), "ADMIN@mapfre.com"))
                .isInstanceOf(AutoDesactivacionError.class);
        verify(userRepository, never()).save(any());
        assertThat(self.getIsActive()).isEqualTo("Y");
    }

    @Test
    @DisplayName("Extra: rol inexistente en catálogo lanza RolInvalidoError y no se guarda")
    void extra_invalidRole() {
        UserCreateRequest req = new UserCreateRequest("Ana Pérez", "ana@mapfre.com", "EMPLEADO", "x");
        when(userRepository.existsByEmailIgnoreCase("ana@mapfre.com")).thenReturn(false);
        when(userRoleRepository.findByRoleName("EMPLEADO")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.create(req)).isInstanceOf(RolInvalidoError.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Extra: reactivar una cuenta ya activa lanza EstadoCuentaError")
    void extra_activateAlreadyActive() {
        when(userRepository.findById(8L)).thenReturn(Optional.of(user(8L, "eva@mapfre.com", "Y")));

        assertThatThrownBy(() -> userService.updateStatus(UserIdCodec.encode(8L).toString(),
                new UserStatusUpdateRequest("Activo"), ADMIN_EMAIL))
                .isInstanceOf(EstadoCuentaError.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Extra: userId no decodificable lanza UsuarioNoEncontradoError sin consultar BBDD")
    void extra_undecodableUserId() {
        assertThatThrownBy(() -> userService.get("no-es-un-uuid"))
                .isInstanceOf(UsuarioNoEncontradoError.class);
        assertThatThrownBy(() -> userService.updateStatus("ffffffff-0000-0000-0000-000000000001",
                new UserStatusUpdateRequest("Inactivo"), ADMIN_EMAIL))
                .isInstanceOf(UsuarioNoEncontradoError.class);
        verify(userRepository, never()).findById(any());
        verify(userRepository, never()).save(any());
    }
}
