package com.grupo4.enao.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "exam_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicant_id", nullable = false, unique = true)
    private Applicant applicant;

    private Double score;

    private Double maximumScore;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.NOT_AVAILABLE;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime publishedAt = LocalDateTime.now();

    public enum Status {
        NOT_AVAILABLE,
        PUBLISHED,
        ANNULLED
    }
}
