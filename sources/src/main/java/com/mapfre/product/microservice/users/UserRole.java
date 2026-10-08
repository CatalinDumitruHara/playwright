package com.mapfre.product.microservice.users;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Immutable;

/**
 * Catálogo de roles (tabla {@code user_roles}). Solo lectura.
 */
@Entity
@Immutable
@Table(name = "user_roles")
@Getter
@Setter
public class UserRole {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "role_name", nullable = false, length = 50, unique = true)
    private String roleName;
}
