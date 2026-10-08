package com.mapfre.product.microservice.users;

import com.fasterxml.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;

class UsuarioControllerIT extends AbstractOracleIT {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserRoleRepository userRoleRepository;

    @Autowired
    ObjectMapper objectMapper;

    @BeforeEach
    void clean() {
        userRepository.deleteAll();
    }

    private User seedUser(String fullName, String email, String roleName, String isActive) {
        User u = new User();
        u.setFullName(fullName);
        u.setEmail(email);
        u.setPasswordHash("x");
        u.setRole(userRoleRepository.findByRoleName(roleName).orElseThrow());
        u.setIsActive(isActive);
        OffsetDateTime now = OffsetDateTime.now();
        u.setCreatedAt(now);
        u.setUpdatedAt(now);
        return userRepository.save(u);
    }

    private static JwtRequestPostProcessor admin() {
        return jwt().jwt(j -> j.subject("admin@mapfre.com").claim("roles", List.of("ADMINISTRADOR")))
                .authorities(new SimpleGrantedAuthority("ROLE_ADMINISTRADOR"));
    }

    private static JwtRequestPostProcessor manager() {
        return jwt().jwt(j -> j.subject("manager@mapfre.com").claim("roles", List.of("MANAGER")))
                .authorities(new SimpleGrantedAuthority("ROLE_MANAGER"));
    }

    private String json(Object body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    @Test
    void contextLoads() {
    }

    @Test
    @DisplayName("POST crea usuario -> 201, UserDetail snake_case, BBDD is_active=Y y password hasheada")
    void createUser() throws Exception {
        Map<String, Object> body = Map.of(
                "full_name", "Ana Pérez",
                "email", "ana.perez@mapfre.com",
                "user_role", "EMPLEADO",
                "initial_password", "Secreta123!");

        mockMvc.perform(post("/api/admin/users").with(admin())
                        .contentType(MediaType.APPLICATION_JSON).content(json(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user_id").isNotEmpty())
                .andExpect(jsonPath("$.full_name").value("Ana Pérez"))
                .andExpect(jsonPath("$.email").value("ana.perez@mapfre.com"))
                .andExpect(jsonPath("$.user_role").value("EMPLEADO"))
                .andExpect(jsonPath("$.status").value("Activo"));

        User saved = userRepository.findByEmailIgnoreCase("ana.perez@mapfre.com").orElseThrow();
        assertThat(saved.getIsActive()).isEqualTo("Y");
        assertThat(saved.getPasswordHash()).isNotBlank().isNotEqualTo("Secreta123!");
    }

    @Test
    @DisplayName("POST con email duplicado -> 409 USR-409 y no se crea un segundo usuario")
    void createUserDuplicateEmail() throws Exception {
        seedUser("Luis Gómez", "luis.gomez@mapfre.com", "EMPLEADO", "Y");
        Map<String, Object> body = Map.of(
                "full_name", "Otro Luis",
                "email", "LUIS.GOMEZ@mapfre.com",
                "user_role", "MANAGER");

        mockMvc.perform(post("/api/admin/users").with(admin())
                        .contentType(MediaType.APPLICATION_JSON).content(json(body)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USR-409"));

        long count = userRepository.findAll().stream()
                .filter(u -> u.getEmail().equalsIgnoreCase("luis.gomez@mapfre.com"))
                .count();
        assertThat(count).isEqualTo(1);
        assertThat(userRepository.findByEmailIgnoreCase("luis.gomez@mapfre.com").orElseThrow().getFullName())
                .isEqualTo("Luis Gómez");
    }

    @Test
    @DisplayName("GET listado -> 200 paginado (page=1,size=20) ordenado por full_name; filtros user_role/status (AC-USR-02)")
    void listUsers() throws Exception {
        seedUser("Carlos Ruiz", "carlos.ruiz@mapfre.com", "MANAGER", "Y");
        seedUser("Ana Lopez", "ana.lopez@mapfre.com", "EMPLEADO", "Y");
        seedUser("Beatriz Sanz", "beatriz.sanz@mapfre.com", "MANAGER", "N");
        seedUser("Diego Martin", "diego.martin@mapfre.com", "MANAGER", "Y");

        mockMvc.perform(get("/api/admin/users").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(4))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.items.length()").value(4))
                .andExpect(jsonPath("$.items[0].full_name").value("Ana Lopez"))
                .andExpect(jsonPath("$.items[1].full_name").value("Beatriz Sanz"))
                .andExpect(jsonPath("$.items[2].full_name").value("Carlos Ruiz"))
                .andExpect(jsonPath("$.items[3].full_name").value("Diego Martin"))
                .andExpect(jsonPath("$.items[0].user_id").isNotEmpty())
                .andExpect(jsonPath("$.items[0].email").value("ana.lopez@mapfre.com"))
                .andExpect(jsonPath("$.items[0].user_role").value("EMPLEADO"))
                .andExpect(jsonPath("$.items[0].status").value("Activo"))
                .andExpect(jsonPath("$.items[1].status").value("Inactivo"));

        mockMvc.perform(get("/api/admin/users").with(admin())
                        .param("user_role", "MANAGER").param("status", "Activo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].full_name").value("Carlos Ruiz"))
                .andExpect(jsonPath("$.items[1].full_name").value("Diego Martin"))
                .andExpect(jsonPath("$.items[*].user_role").value(org.hamcrest.Matchers.everyItem(
                        org.hamcrest.Matchers.is("MANAGER"))))
                .andExpect(jsonPath("$.items[*].status").value(org.hamcrest.Matchers.everyItem(
                        org.hamcrest.Matchers.is("Activo"))));
    }

    @Test
    @DisplayName("GET detalle -> 200 con UserDetail; id inexistente -> 404")
    void getUserDetail() throws Exception {
        User u = seedUser("Elena Vidal", "elena.vidal@mapfre.com", "MANAGER", "Y");
        String userId = UserIdCodec.encode(u.getId()).toString();

        mockMvc.perform(get("/api/admin/users/{id}", userId).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user_id").value(userId))
                .andExpect(jsonPath("$.full_name").value("Elena Vidal"))
                .andExpect(jsonPath("$.email").value("elena.vidal@mapfre.com"))
                .andExpect(jsonPath("$.user_role").value("MANAGER"))
                .andExpect(jsonPath("$.status").value("Activo"));

        mockMvc.perform(get("/api/admin/users/{id}", UserIdCodec.encode(999999L).toString()).with(admin()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT modifica full_name y user_role -> 200 y reflejado en BBDD; email inmutable")
    void updateUser() throws Exception {
        User u = seedUser("Fernando Gil", "fernando.gil@mapfre.com", "EMPLEADO", "Y");
        String userId = UserIdCodec.encode(u.getId()).toString();
        Map<String, Object> body = Map.of(
                "full_name", "Fernando Gil Ortega",
                "user_role", "MANAGER");

        mockMvc.perform(put("/api/admin/users/{id}", userId).with(admin())
                        .contentType(MediaType.APPLICATION_JSON).content(json(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user_id").value(userId))
                .andExpect(jsonPath("$.full_name").value("Fernando Gil Ortega"))
                .andExpect(jsonPath("$.user_role").value("MANAGER"))
                .andExpect(jsonPath("$.email").value("fernando.gil@mapfre.com"));

        User saved = userRepository.findById(u.getId()).orElseThrow();
        assertThat(saved.getFullName()).isEqualTo("Fernando Gil Ortega");
        assertThat(saved.getRole().getId())
                .isEqualTo(userRoleRepository.findByRoleName("MANAGER").orElseThrow().getId());
        assertThat(saved.getEmail()).isEqualTo("fernando.gil@mapfre.com");
    }

    @Test
    @DisplayName("PATCH status Inactivo -> 200 y BBDD 'N'; PATCH Activo -> 200 y BBDD 'Y' (REQ-020)")
    void updateStatusDeactivateAndReactivate() throws Exception {
        User u = seedUser("Gloria Navas", "gloria.navas@mapfre.com", "EMPLEADO", "Y");
        String userId = UserIdCodec.encode(u.getId()).toString();

        mockMvc.perform(patch("/api/admin/users/{id}/status", userId).with(admin())
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("status", "Inactivo"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user_id").value(userId))
                .andExpect(jsonPath("$.status").value("Inactivo"));
        assertThat(userRepository.findById(u.getId()).orElseThrow().getIsActive()).isEqualTo("N");

        mockMvc.perform(patch("/api/admin/users/{id}/status", userId).with(admin())
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("status", "Activo"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Activo"));
        assertThat(userRepository.findById(u.getId()).orElseThrow().getIsActive()).isEqualTo("Y");
    }
}
