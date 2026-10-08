package com.mapfre.product.microservice.users;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Test
    void contextLoads() {
    }
}
