package com.grupo4.enao.repository;

import com.grupo4.enao.model.Applicant;
import com.grupo4.enao.model.ApplicantDocument;
import com.grupo4.enao.model.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicantDocumentRepository extends JpaRepository<ApplicantDocument, Long> {

    Optional<ApplicantDocument> findByStorageKey(String storageKey);

    List<ApplicantDocument> findByApplicantOrderByUploadedAtDesc(Applicant applicant);

    long countByApplicant(Applicant applicant);

    Optional<ApplicantDocument> findByIdAndApplicant(Long id, Applicant applicant);

    @Query("select coalesce(sum(d.sizeBytes), 0) from ApplicantDocument d where d.applicant = :applicant")
    long totalBytesByApplicant(@Param("applicant") Applicant applicant);

    @Query("select d from ApplicantDocument d where d.status = :status order by d.uploadedAt desc")
    List<ApplicantDocument> findByStatus(@Param("status") DocumentStatus status);
}