package com.grupo4.enao.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicantFullResponse {
    private Long id;
    private String fullName;
    private String docType;
    private String docNumber;
    private String email;
    private String phone;
    private String emergencyContact;
    private String emergencyPhone;
    private String address;
    private String university;
    private String country;
    private String otherUniversity;
    private String organization;
    private String bank;
    private String receiptCode;
    private String status;
    private String createdAt;
    private String updatedAt;
}
