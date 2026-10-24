package com.grupo4.enao.repository;

import com.grupo4.enao.model.Role;
import com.grupo4.enao.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    Optional<User> findFirstByRoleOrderByCreatedAtAsc(Role role);
}