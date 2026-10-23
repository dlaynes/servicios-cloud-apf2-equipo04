package com.grupo4.enao.repository;

import com.grupo4.enao.model.Applicant;
import com.grupo4.enao.model.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {
    Optional<ExamResult> findByApplicant(Applicant applicant);
    Optional<ExamResult> findByApplicant_DocNumber(String docNumber);

    // ---------------------------------------------------------- RF-08 (reportes)
    @Query("select r.status, count(r) from ExamResult r group by r.status")
    List<Object[]> countByStatus();

    @Query("select count(r), avg(r.score), max(r.score), min(r.score) from ExamResult r")
    List<Object[]> summary();
}