package com.mapfre.product.microservice.users;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    boolean existsByEmailIgnoreCase(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    /** Listados paginados: carga rol y manager en la misma consulta (evita N+1). */
    @Override
    @EntityGraph(attributePaths = {"role", "manager"})
    Page<User> findAll(Specification<User> spec, Pageable pageable);
}
