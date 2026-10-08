package com.mapfre.product.microservice.users;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;

class HierarchyControllerIT extends AbstractOracleIT {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserRoleRepository userRoleRepository;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        cleanDb();
    }

    @AfterEach
    void tearDown() {
        cleanDb();
    }

    private void cleanDb() {
        jdbcTemplate.execute("DELETE FROM VACATION_REQUESTS");
        jdbcTemplate.execute("UPDATE USERS SET MANAGER_ID = NULL");
        jdbcTemplate.execute("DELETE FROM USERS");
    }

    private User seedUser(String fullName, String email, String roleName) {
        User u = new User();
        u.setFullName(fullName);
        u.setEmail(email);
        u.setPasswordHash("x");
        u.setRole(userRoleRepository.findByRoleName(roleName).orElseThrow());
        u.setIsActive("Y");
        OffsetDateTime now = OffsetDateTime.now();
        u.setCreatedAt(now);
        u.setUpdatedAt(now);
        return userRepository.save(u);
    }

    private static String apiId(User u) {
        return UserIdCodec.encode(u.getId()).toString();
    }

    private static JwtRequestPostProcessor admin() {
        return jwt().jwt(j -> j.subject("admin@mapfre.com").claim("roles", List.of("ADMINISTRADOR")))
                .authorities(new SimpleGrantedAuthority("ROLE_ADMINISTRADOR"));
    }

    private static JwtRequestPostProcessor manager() {
        return jwt().jwt(j -> j.subject("manager@mapfre.com").claim("roles", List.of("MANAGER")))
                .authorities(new SimpleGrantedAuthority("ROLE_MANAGER"));
    }

    private String assignBody(String managerApiId) throws Exception {
        return objectMapper.writeValueAsString(Map.of("manager_id", managerApiId));
    }

    private Long managerIdInDb(Long userId) {
        return jdbcTemplate.queryForObject("SELECT MANAGER_ID FROM USERS WHERE ID = ?", Long.class, userId);
    }

    @Test
    void contextLoads() {
    }

    @Test
    @DisplayName("IT-003: auto-asignación como manager -> 400 y sin cambios en BBDD")
    void it003_selfAssignManager_returns400_andNoDbChanges() throws Exception {
        User emp = seedUser("Empleado Uno", "emp1@mapfre.com", "EMPLEADO");
        Timestamp before = jdbcTemplate.queryForObject(
                "SELECT UPDATED_AT FROM USERS WHERE ID = ?", Timestamp.class, emp.getId());

        mockMvc.perform(post("/api/admin/employees/{id}/manager", apiId(emp))
                        .with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody(apiId(emp))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("USR-400-SELF-MANAGER"));

        assertThat(managerIdInDb(emp.getId())).isNull();
        Timestamp after = jdbcTemplate.queryForObject(
                "SELECT UPDATED_AT FROM USERS WHERE ID = ?", Timestamp.class, emp.getId());
        assertThat(after).isEqualTo(before);
    }

    private void assignVia(String method, User emp, User mgr) throws Exception {
        var builder = "PUT".equals(method)
                ? put("/api/admin/employees/{id}/manager", apiId(emp))
                : post("/api/admin/employees/{id}/manager", apiId(emp));
        mockMvc.perform(builder.with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody(apiId(mgr))))
                .andExpect(status().is2xxSuccessful());
    }

    @Test
    void assign_returns201_andPersists() throws Exception {
        User emp = seedUser("Empleado Uno", "emp1@mapfre.com", "EMPLEADO");
        User mgr = seedUser("Manager A", "mgra@mapfre.com", "MANAGER");

        mockMvc.perform(post("/api/admin/employees/{id}/manager", apiId(emp))
                        .with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody(apiId(mgr))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employee_id").value(apiId(emp)))
                .andExpect(jsonPath("$.employee_name").value("Empleado Uno"))
                .andExpect(jsonPath("$.manager_id").value(apiId(mgr)))
                .andExpect(jsonPath("$.manager_name").value("Manager A"));

        assertThat(managerIdInDb(emp.getId())).isEqualTo(mgr.getId());
    }

    @Test
    void assign_whenAlreadyHasManager_returns409() throws Exception {
        User emp = seedUser("Empleado Uno", "emp1@mapfre.com", "EMPLEADO");
        User a = seedUser("Manager A", "mgra@mapfre.com", "MANAGER");
        User b = seedUser("Manager B", "mgrb@mapfre.com", "MANAGER");
        assignVia("POST", emp, a);

        mockMvc.perform(post("/api/admin/employees/{id}/manager", apiId(emp))
                        .with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody(apiId(b))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USR-409-MANAGER"));

        assertThat(managerIdInDb(emp.getId())).isEqualTo(a.getId());
    }

    @Test
    void assign_managerWithoutManagerRole_returns400() throws Exception {
        User emp = seedUser("Empleado Uno", "emp1@mapfre.com", "EMPLEADO");
        User other = seedUser("Empleado Dos", "emp2@mapfre.com", "EMPLEADO");

        mockMvc.perform(post("/api/admin/employees/{id}/manager", apiId(emp))
                        .with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody(apiId(other))))
                .andExpect(status().isBadRequest());

        assertThat(managerIdInDb(emp.getId())).isNull();
    }

    @Test
    void assign_unknownEmployee_returns404() throws Exception {
        User mgr = seedUser("Manager A", "mgra@mapfre.com", "MANAGER");

        mockMvc.perform(post("/api/admin/employees/{id}/manager", UserIdCodec.encode(999999999L).toString())
                        .with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody(apiId(mgr))))
                .andExpect(status().isNotFound());
    }

    @Test
    void put_changesManager_returns200() throws Exception {
        User emp = seedUser("Empleado Uno", "emp1@mapfre.com", "EMPLEADO");
        User a = seedUser("Manager A", "mgra@mapfre.com", "MANAGER");
        User b = seedUser("Manager B", "mgrb@mapfre.com", "MANAGER");
        assignVia("POST", emp, a);

        mockMvc.perform(put("/api/admin/employees/{id}/manager", apiId(emp))
                        .with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody(apiId(b))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.manager_id").value(apiId(b)));

        assertThat(managerIdInDb(emp.getId())).isEqualTo(b.getId());
    }

    @Test
    void put_sameManager_returns400() throws Exception {
        User emp = seedUser("Empleado Uno", "emp1@mapfre.com", "EMPLEADO");
        User a = seedUser("Manager A", "mgra@mapfre.com", "MANAGER");
        assignVia("POST", emp, a);

        mockMvc.perform(put("/api/admin/employees/{id}/manager", apiId(emp))
                        .with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody(apiId(a))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("USR-400-SAME-MANAGER"));

        assertThat(managerIdInDb(emp.getId())).isEqualTo(a.getId());
    }

    @Test
    void put_withoutManager_returns409() throws Exception {
        User emp = seedUser("Empleado Uno", "emp1@mapfre.com", "EMPLEADO");
        User a = seedUser("Manager A", "mgra@mapfre.com", "MANAGER");

        mockMvc.perform(put("/api/admin/employees/{id}/manager", apiId(emp))
                        .with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody(apiId(a))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USR-409-NO-MANAGER"));

        assertThat(managerIdInDb(emp.getId())).isNull();
    }

    @Test
    void delete_removesManager_returns204() throws Exception {
        User emp = seedUser("Empleado Uno", "emp1@mapfre.com", "EMPLEADO");
        User a = seedUser("Manager A", "mgra@mapfre.com", "MANAGER");
        assignVia("POST", emp, a);

        mockMvc.perform(delete("/api/admin/employees/{id}/manager", apiId(emp)).with(admin()))
                .andExpect(status().isNoContent());
        assertThat(managerIdInDb(emp.getId())).isNull();

        mockMvc.perform(delete("/api/admin/employees/{id}/manager", apiId(emp)).with(admin()))
                .andExpect(status().isConflict());
    }

    @Test
    void withoutToken_returns401() throws Exception {
        User emp = seedUser("Empleado Uno", "emp1@mapfre.com", "EMPLEADO");
        User a = seedUser("Manager A", "mgra@mapfre.com", "MANAGER");

        mockMvc.perform(post("/api/admin/employees/{id}/manager", apiId(emp))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody(apiId(a))))
                .andExpect(status().isUnauthorized());

        assertThat(managerIdInDb(emp.getId())).isNull();
    }

    @Test
    void withManagerRole_returns403() throws Exception {
        User emp = seedUser("Empleado Uno", "emp1@mapfre.com", "EMPLEADO");
        User a = seedUser("Manager A", "mgra@mapfre.com", "MANAGER");

        mockMvc.perform(post("/api/admin/employees/{id}/manager", apiId(emp))
                        .with(manager())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody(apiId(a))))
                .andExpect(status().isForbidden());

        assertThat(managerIdInDb(emp.getId())).isNull();
    }

    @Test
    void hierarchy_listsAndFilters() throws Exception {
        User a = seedUser("Manager A", "mgra@mapfre.com", "MANAGER");
        User emp1 = seedUser("Empleado Uno", "emp1@mapfre.com", "EMPLEADO");
        User emp2 = seedUser("Empleado Dos", "emp2@mapfre.com", "EMPLEADO");
        assignVia("POST", emp1, a);

        mockMvc.perform(get("/api/admin/hierarchy").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.items.length()").value(3))
                .andExpect(jsonPath("$.items[0].employee_email").exists());

        mockMvc.perform(get("/api/admin/hierarchy").with(admin())
                        .param("filter_by_manager", apiId(a)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].employee_id").value(apiId(emp1)))
                .andExpect(jsonPath("$.items[0].manager_name").value("Manager A"));

        mockMvc.perform(get("/api/admin/hierarchy").with(admin())
                        .param("filter_by_unassigned", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2));

        mockMvc.perform(get("/api/admin/hierarchy").with(admin())
                        .param("filter_by_manager", apiId(emp2)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/admin/hierarchy"))
                .andExpect(status().isUnauthorized());
    }
}
