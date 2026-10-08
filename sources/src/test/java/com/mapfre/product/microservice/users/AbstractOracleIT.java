package com.mapfre.product.microservice.users;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.oracle.OracleContainer;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("it")
public abstract class AbstractOracleIT {

    private static OracleContainer oracle;

    private static synchronized OracleContainer oracle() {
        if (oracle == null) {
            oracle = new OracleContainer("gvenzl/oracle-free:23-slim");
            oracle.start();
        }
        return oracle;
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry r) {
        String url = System.getenv("MIND_ENV_ORACLE_URL");
        if (url != null) {
            r.add("spring.datasource.url", () -> url);
            r.add("spring.datasource.username", () -> System.getenv("MIND_ENV_ORACLE_USER"));
            r.add("spring.datasource.password", () -> System.getenv("MIND_ENV_ORACLE_PASSWORD"));
        } else {
            OracleContainer c = oracle();
            r.add("spring.datasource.url", c::getJdbcUrl);
            r.add("spring.datasource.username", c::getUsername);
            r.add("spring.datasource.password", c::getPassword);
        }
    }
}
