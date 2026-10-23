package com.grupo4.enao.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "applicants", uniqueConstraints = {
        @UniqueConstraint(columnNames = "docNumber", name = "uk_applicant_doc")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Applicant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String docType;

    @Column(nullable = false, unique = true)
    private String docNumber;

    @Column(nullable = false)
    private String email;

    private String phone;

    private String emergencyContact;

    private String emergencyPhone;

    private String address;

    @Column(nullable = false)
    private String passwordHash;

    @Embedded
    @Builder.Default
    private ApplicationData applicationData = new ApplicationData();

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
