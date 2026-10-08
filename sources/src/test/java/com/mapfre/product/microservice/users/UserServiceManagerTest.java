package com.mapfre.product.microservice.users;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mapfre.product.microservice.users.dto.HierarchyNodeDetail;
import com.mapfre.product.microservice.users.dto.ManagerAssignmentRequest;
import com.mapfre.product.microservice.users.error.AutoAsignacionError;
import com.mapfre.product.microservice.users.error.ConflictoAsignacionError;
import com.mapfre.product.microservice.users.error.ManagerNoAsignadoError;
import com.mapfre.product.microservice.users.error.MismoManagerError;
import com.mapfre.product.microservice.users.error.RolInvalidoError;
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
class UserServiceManagerTest {

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

    private static User user(long id, String roleName) {
        User u = new User();
        u.setId(id);
        u.setFullName("Usuario " + id);
        u.setEmail("user" + id + "@mapfre.com");
        u.setPasswordHash("$2a$10$hash");
        u.setRole(role("MANAGER".equals(roleName) ? 2L : 1L, roleName));
        u.setIsActive(UserStatus.DB_ACTIVE);
        return u;
    }

    private static String apiId(long id) {
        return UserIdCodec.encode(id).toString();
    }

    private static ManagerAssignmentRequest req(long managerId) {
        return new ManagerAssignmentRequest(apiId(managerId));
    }

    @Test
    @DisplayName("UT-014: assignManager con employeeId == manager_id lanza AutoAsignacionError")
    void ut014_assignManager_selfAssignment() {
        User employee = user(10L, "EMPLEADO");
        when(userRepository.findById(10L)).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> userService.assignManager(apiId(10L), req(10L)))
                .isInstanceOf(AutoAsignacionError.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("UT-014b: changeManager con employeeId == manager_id lanza AutoAsignacionError")
    void ut014b_changeManager_selfAssignment() {
        User employee = user(10L, "EMPLEADO");
        employee.setManager(user(20L, "MANAGER"));
        when(userRepository.findById(10L)).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> userService.changeManager(apiId(10L), req(10L)))
                .isInstanceOf(AutoAsignacionError.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("UT-015: assignManager a empleado que ya tiene manager lanza ConflictoAsignacionError")
    void ut015_assignManager_alreadyAssigned() {
        User employee = user(10L, "EMPLEADO");
        employee.setManager(user(20L, "MANAGER"));
        User newManager = user(30L, "MANAGER");
        when(userRepository.findById(10L)).thenReturn(Optional.of(employee));
        when(userRepository.findById(30L)).thenReturn(Optional.of(newManager));

        assertThatThrownBy(() -> userService.assignManager(apiId(10L), req(30L)))
                .isInstanceOf(ConflictoAsignacionError.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("UT-016: changeManager con el mismo manager actual lanza MismoManagerError")
    void ut016_changeManager_sameManager() {
        User employee = user(10L, "EMPLEADO");
        employee.setManager(user(20L, "MANAGER"));
        when(userRepository.findById(10L)).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> userService.changeManager(apiId(10L), req(20L)))
                .isInstanceOf(MismoManagerError.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("assignManager a empleado sin manager con usuario MANAGER devuelve el nodo y persiste")
    void assignManager_happyPath() {
        User employee = user(10L, "EMPLEADO");
        User manager = user(20L, "MANAGER");
        when(userRepository.findById(10L)).thenReturn(Optional.of(employee));
        when(userRepository.findById(20L)).thenReturn(Optional.of(manager));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        HierarchyNodeDetail result = userService.assignManager(apiId(10L), req(20L));

        assertThat(result.employeeId()).isEqualTo(UserIdCodec.encode(10L));
        assertThat(result.employeeName()).isEqualTo("Usuario 10");
        assertThat(result.managerId()).isEqualTo(UserIdCodec.encode(20L));
        assertThat(result.managerName()).isEqualTo("Usuario 20");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getManager()).isSameAs(manager);
        assertThat(captor.getValue().getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("assignManager con usuario de rol EMPLEADO como manager lanza RolInvalidoError")
    void assignManager_managerWithoutManagerRole() {
        User employee = user(10L, "EMPLEADO");
        User notManager = user(20L, "EMPLEADO");
        when(userRepository.findById(10L)).thenReturn(Optional.of(employee));
        when(userRepository.findById(20L)).thenReturn(Optional.of(notManager));

        assertThatThrownBy(() -> userService.assignManager(apiId(10L), req(20L)))
                .isInstanceOf(RolInvalidoError.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("changeManager a empleado sin manager actual lanza ManagerNoAsignadoError")
    void changeManager_withoutCurrentManager() {
        User employee = user(10L, "EMPLEADO");
        when(userRepository.findById(10L)).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> userService.changeManager(apiId(10L), req(20L)))
                .isInstanceOf(ManagerNoAsignadoError.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("removeManager a empleado sin manager lanza ManagerNoAsignadoError")
    void removeManager_withoutManager() {
        User employee = user(10L, "EMPLEADO");
        when(userRepository.findById(10L)).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> userService.removeManager(apiId(10L)))
                .isInstanceOf(ManagerNoAsignadoError.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("removeManager a empleado con manager persiste con manager null")
    void removeManager_happyPath() {
        User employee = user(10L, "EMPLEADO");
        employee.setManager(user(20L, "MANAGER"));
        when(userRepository.findById(10L)).thenReturn(Optional.of(employee));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.removeManager(apiId(10L));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo(10L);
        assertThat(captor.getValue().getManager()).isNull();
        assertThat(captor.getValue().getUpdatedAt()).isNotNull();
    }
}
