package com.grupo4.enao.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Comprobante de inscripcion descargable (RF-04). Cada emision queda con
 * serial y hash para poder verificarla despues por el codigo publico.
 */
@Entity
@Table(name = "comprobantes", uniqueConstraints = {
        @UniqueConstraint(columnNames = "serial", name = "uk_comprobante_serial")
}, indexes = {
        @Index(name = "ix_comprobantes_applicant", columnList = "applicant_id"),
        @Index(name = "ix_comprobantes_state", columnList = "state")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comprobante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "applicant_id", nullable = false)
    private Applicant applicant;

    /** serial publico e intransferible, usado para la verificacion. */
    @Column(nullable = false, length = 36)
    private String serial;

    /** hash sha256 del contenido del PDF ya generado. */
    @Column(nullable = false, length = 64)
    private String sha256;

    /** ruta dentro del almacenamiento donde vive el PDF. */
    @Column(nullable = false, length = 255)
    private String storageKey;

    /** copia de los datos al momento de la emision, para trazabilidad. */
    @Column(nullable = false, length = 50)
    private String period;

    @Column(nullable = false, length = 100)
    private String campus;

    @Column(nullable = false, length = 255)
    private String institution;

    @Column(nullable = false, length = 30)
    private String enrollmentStatus;

    @Column(nullable = false)
    private LocalDateTime generatedAt;

    @Column(length = 100)
    private String generatedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ComprobanteState state = ComprobanteState.ACTIVE;

    private LocalDateTime annulledAt;
}