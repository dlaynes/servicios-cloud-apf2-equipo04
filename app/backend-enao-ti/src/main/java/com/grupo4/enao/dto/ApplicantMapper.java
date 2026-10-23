package com.grupo4.enao.dto;

import com.grupo4.enao.model.Applicant;
import com.grupo4.enao.model.ApplicationData;
import com.grupo4.enao.model.ExamResult;

import java.time.format.DateTimeFormatter;

public class ApplicantMapper {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public static Applicant toEntity(ApplicantRequest dto) {
        ApplicationData.SponsoringOrganization org;
        try {
            org = ApplicationData.SponsoringOrganization.valueOf(dto.getOrganization());
        } catch (IllegalArgumentException e) {
            org = null;
        }

        ApplicationData data = ApplicationData.builder()
                .period(dto.getPeriod())
                .campus(dto.getCampus())
                .university(dto.getUniversity())
                .internationalUniversity(Boolean.TRUE.equals(dto.getInternationalUniversity()))
                .country(dto.getCountry())
                .otherUniversity(dto.getOtherUniversity())
                .organization(org)
                .bank(dto.getBank())
                .receiptCode(dto.getReceiptCode())
                .status(ApplicationData.ApplicationStatus.PENDING)
                .build();

        return Applicant.builder()
                .fullName(dto.getFullName())
                .docType(dto.getDocType())
                .docNumber(dto.getDocNumber())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .emergencyContact(dto.getEmergencyContact())
                .emergencyPhone(dto.getEmergencyPhone())
                .address(dto.getAddress())
                .applicationData(data)
                .build();
    }

    public static void updateEntity(Applicant applicant, ApplicantUpdateRequest dto) {
        ApplicationData.SponsoringOrganization org;
        try {
            org = ApplicationData.SponsoringOrganization.valueOf(dto.getOrganization());
        } catch (IllegalArgumentException e) {
            org = null;
        }

        ApplicationData data = applicant.getApplicationData();
        if (dto.getPeriod() != null) {
            data.setPeriod(dto.getPeriod());
        }
        if (dto.getCampus() != null) {
            data.setCampus(dto.getCampus());
        }
        data.setOrganization(org);
        data.setBank(dto.getBank());
        data.setReceiptCode(dto.getReceiptCode());
        data.setStatus(ApplicationData.ApplicationStatus.PENDING);
    }

    public static ApplicantProfileResponse toProfile(Applicant applicant) {
        ApplicationData data = applicant.getApplicationData();
        return ApplicantProfileResponse.builder()
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
                .createdAt(applicant.getCreatedAt() != null ? applicant.getCreatedAt().format(FORMATTER) : null)
                .updatedAt(applicant.getUpdatedAt() != null ? applicant.getUpdatedAt().format(FORMATTER) : null)
                .build();
    }

    public static ExamResultResponse toResult(ExamResult result) {
        if (result == null || result.getStatus() == ExamResult.Status.NOT_AVAILABLE) {
            return ExamResultResponse.builder()
                    .available(false)
                    .status("NOT_AVAILABLE")
                    .message("Los resultados aún no han sido publicados.")
                    .build();
        }

        return ExamResultResponse.builder()
                .available(true)
                .score(result.getScore())
                .maximumScore(result.getMaximumScore())
                .status(result.getStatus().name())
                .message("Resultado publicado correctamente.")
                .publishedAt(result.getPublishedAt() != null ? result.getPublishedAt().format(FORMATTER) : null)
                .build();
    }
}
