package com.grupo4.enao.dto;

import com.grupo4.enao.model.DocumentStatus;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

/** Respuesta del backend al subir o listar un documento (RF-03). */
@Value
@Builder
public class DocumentUploadResponse {

    Long id;
    Long applicantId;
    String applicantName;
    String documentType;
    String originalName;
    String storageKey;
    String declaredContentType;
    String detectedContentType;
    long sizeBytes;
    String sha256;
    DocumentStatus status;
    String uploadComment;
    String reviewedBy;
    String reviewComment;
    LocalDateTime uploadedAt;
    LocalDateTime reviewedAt;
    long downloadCount;
    LocalDateTime lastDownloadAt;
}