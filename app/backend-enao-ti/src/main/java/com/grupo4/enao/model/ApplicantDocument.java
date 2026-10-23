package com.grupo4.enao.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Documento adjunto de una inscripcion (RF-03). Los bytes viven en el
 * almacenamiento de objetos; aqui se guarda la metadata y el hash.
 */
@Entity
@Table(name = "applicant_documents", uniqueConstraints = {
        @UniqueConstraint(columnNames = "storage_key", name = "uk_document_storage_key")
}, indexes = {
        @Index(name = "ix_documents_applicant", columnList = "applicant_id"),
        @Index(name = "ix_documents_type_status", columnList = "document_type, status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicantDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "applicant_id", nullable = false)
    private Applicant applicant;

    /** tipo declarado por el postulante (DNI, CERTIFICADO, etc.). */
    @Column(nullable = false, length = 50)
    private String documentType;

    /** nombre original solo para mostrar, nunca se usa como clave. */
    @Column(nullable = false, length = 255)
    private String originalName;

    /** clave dentro del almacenamiento de objetos; es la referencia real. */
    @Column(name = "storage_key", nullable = false, length = 255)
    private String storageKey;

    /** mime declarado por el cliente (puede ser falso). */
    @Column(nullable = false, length = 100)
    private String declaredContentType;

    /** mime detectado por magic bytes; es el valor de confianza. */
    @Column(nullable = false, length = 100)
    private String detectedContentType;

    @Column(nullable = false)
    private long sizeBytes;

    /** sha256 del contenido, para integridad y desduplicacion. */
    @Column(nullable = false, length = 64)
    private String sha256;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DocumentStatus status = DocumentStatus.PENDING;

    @Column(length = 500)
    private String uploadComment;

    @Column(length = 500)
    private String reviewComment;

    /** usuario administrador que reviso el documento. */
    @Column(length = 100)
    private String reviewedBy;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    private LocalDateTime reviewedAt;

    /** numero de accesos registrados, para auditoria basica. */
    @Column(nullable = false)
    @Builder.Default
    private long downloadCount = 0L;

    private LocalDateTime lastDownloadAt;
}