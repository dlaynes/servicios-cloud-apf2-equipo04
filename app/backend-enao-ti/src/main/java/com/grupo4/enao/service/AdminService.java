package com.grupo4.enao.service;

import com.grupo4.enao.dto.*;
import com.grupo4.enao.model.Applicant;
import com.grupo4.enao.model.ApplicationData;
import com.grupo4.enao.model.ExamResult;
import com.grupo4.enao.repository.ApplicantRepository;
import com.grupo4.enao.repository.ExamResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final ApplicantRepository applicantRepository;
    private final ExamResultRepository examResultRepository;

    @Transactional(readOnly = true)
    public List<ApplicantFullResponse> listApplicants() {
        return applicantRepository.findAll().stream()
                .map(this::toFullResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ApplicantFullResponse getApplicant(Long id) {
        Applicant applicant = applicantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Postulante no encontrado"));
        return toFullResponse(applicant);
    }

    @Transactional
    public ApplicantFullResponse updateApplicantStatus(Long id, ApplicantStatusUpdateRequest request) {
        Applicant applicant = applicantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Postulante no encontrado"));

        ApplicationData.ApplicationStatus status;
        try {
            status = ApplicationData.ApplicationStatus.valueOf(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Estado de postulación inválido: " + request.getStatus());
        }

        applicant.getApplicationData().setStatus(status);
        return toFullResponse(applicantRepository.save(applicant));
    }

    @Transactional(readOnly = true)
    public List<ApplicantFullResponse> searchApplicantsByDocNumber(String docNumber) {
        return applicantRepository.findByDocNumber(docNumber)
                .map(this::toFullResponse)
                .stream().toList();
    }

    @Transactional
    public ExamResultResponse updateResult(Long applicantId, ResultUpdateRequest request) {
        Applicant applicant = applicantRepository.findById(applicantId)
                .orElseThrow(() -> new IllegalArgumentException("Postulante no encontrado"));

        ExamResult.Status status;
        try {
            status = ExamResult.Status.valueOf(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Estado de resultado inválido: " + request.getStatus());
        }

        ExamResult result = examResultRepository.findByApplicant(applicant)
                .orElseGet(() -> ExamResult.builder().applicant(applicant).build());

        result.setScore(request.getScore());
        result.setMaximumScore(request.getMaximumScore());
        result.setStatus(status);
        result.setPublishedAt(LocalDateTime.now());

        ExamResult saved = examResultRepository.save(result);
        return ApplicantMapper.toResult(saved);
    }

    private ApplicantFullResponse toFullResponse(Applicant applicant) {
        ApplicationData data = applicant.getApplicationData();
        return ApplicantFullResponse.builder()
                .id(applicant.getId())
                .fullName(applicant.getFullName())
                .docType(applicant.getDocType())
                .docNumber(applicant.getDocNumber())
                .email(applicant.getEmail())
                .phone(applicant.getPhone())
                .emergencyContact(applicant.getEmergencyContact())
                .emergencyPhone(applicant.getEmergencyPhone())
                .address(applicant.getAddress())
                .university(data.getUniversity())
                .country(data.getCountry())
                .otherUniversity(data.getOtherUniversity())
                .organization(data.getOrganization() != null ? data.getOrganization().name() : null)
                .bank(data.getBank())
                .receiptCode(data.getReceiptCode())
                .status(data.getStatus() != null ? data.getStatus().name() : null)
                .createdAt(applicant.getCreatedAt() != null ? applicant.getCreatedAt().toString() : null)
                .updatedAt(applicant.getUpdatedAt() != null ? applicant.getUpdatedAt().toString() : null)
                .build();
    }
}
