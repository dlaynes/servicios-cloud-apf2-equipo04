package com.grupo4.enao.repository;

import com.grupo4.enao.model.Applicant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ApplicantRepository extends JpaRepository<Applicant, Long> {
    Optional<Applicant> findByDocNumber(String docNumber);
    boolean existsByDocNumber(String docNumber);
    boolean existsByEmail(String email);
}