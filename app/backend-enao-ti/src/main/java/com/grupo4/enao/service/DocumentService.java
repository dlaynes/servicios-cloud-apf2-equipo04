package com.grupo4.enao.service;

import com.grupo4.enao.config.FilesProperties;
import com.grupo4.enao.dto.DocumentReviewRequest;
import com.grupo4.enao.dto.DocumentUploadResponse;
import com.grupo4.enao.dto.FileDownload;
import com.grupo4.enao.storage.ObjectStorageAdapter;
import com.grupo4.enao.exception.BusinessRuleViolationException;
import com.grupo4.enao.exception.ForbiddenOperationException;
import com.grupo4.enao.exception.ResourceNotFoundException;
import com.grupo4.enao.exception.UnsupportedMediaTypeException;
import com.grupo4.enao.model.Applicant;
import com.grupo4.enao.model.ApplicantDocument;
import com.grupo4.enao.model.DocumentStatus;
import com.grupo4.enao.repository.ApplicantDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Documentos adjuntos de la inscripcion (RF-03). Valida tamano y tipo de
 * forma autoritativa, guarda el objeto y deja registro con su hash para
 * poder verificar la integridad y la trazabilidad de cada acceso.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private static final byte[] MAGIC_PDF = {0x25, 0x50, 0x44, 0x46};             // "%PDF"
    private static final byte[] MAGIC_PNG = {(byte) 0x89, 0x50, 0x4E, 0x47};
    private static final byte[] MAGIC_JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};

    private static final String MIME_PDF = "application/pdf";
    private static final String MIME_PNG = "image/png";
    private static final String MIME_JPEG = "image/jpeg";

    private final ApplicantDocumentRepository documentRepository;
    private final FilesProperties files;
    private final ObjectStorageAdapter storageAdapter;

    public ObjectStorageAdapter storageAdapter() {
        return storageAdapter;
    }

    @Transactional
    public DocumentUploadResponse upload(Applicant applicant, MultipartFile file,
                                         String documentType, String uploadComment) {
        String type = documentType == null ? "" : documentType.toUpperCase(Locale.ROOT);
        if (!files.getAllowedTypes().contains(type)) {
            throw new BusinessRuleViolationException(
                    "Tipo de documento no permitido. Valores aceptados: " + files.getAllowedTypes());
        }

        String originalName = sanitize(file.getOriginalFilename());
        String extension = extensionOf(originalName);
        if (!files.getAllowedExtensions().contains(extension)) {
            throw new BusinessRuleViolationException(
                    "Extension no permitida. Extensiones aceptadas: " + files.getAllowedExtensions());
        }

        if (file.getSize() <= 0) {
            throw new BusinessRuleViolationException("El archivo esta vacio");
        }
        if (file.getSize() > files.getMaxFileSizeMb() * 1024L * 1024L) {
            throw new BusinessRuleViolationException(
                    "El archivo supera el tamano maximo de " + files.getMaxFileSizeMb() + " MB");
        }

        long documents = documentRepository.countByApplicant(applicant);
        if (documents >= files.getMaxFilesPerApplicant()) {
            throw new BusinessRuleViolationException(
                    "Ya se alcanzaron los " + files.getMaxFilesPerApplicant() + " documentos permitidos");
        }
        long totalBytes = documentRepository.totalBytesByApplicant(applicant);
        if (totalBytes + file.getSize() > files.getMaxTotalMbPerApplicant() * 1024L * 1024L) {
            throw new BusinessRuleViolationException(
                    "La suma de documentos por postulante supera los " + files.getMaxTotalMbPerApplicant() + " MB");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new IllegalStateException("No fue posible leer el archivo", e);
        }

        String detectedContentType = detectMimeType(bytes)
                .orElseThrow(() -> new UnsupportedMediaTypeException(
                        "El contenido del archivo no corresponde a un tipo permitido"));
        if (!extensionOf(extension, detectedContentType)) {
            throw new BusinessRuleViolationException(
                    "La extension '" + extension + "' no coincide con el tipo de contenido detectado");
        }

        String sha256 = sha256(bytes);
        String key = keyFor(applicant, extension);
        try {
            storageAdapter.store(key, bytes, detectedContentType);
        } catch (IOException e) {
            log.error("no se pudo almacenar el objeto {}", key, e);
            throw new IllegalStateException("No fue posible almacenar el documento", e);
        }

        ApplicantDocument document = ApplicantDocument.builder()
                .applicant(applicant)
                .documentType(type)
                .originalName(originalName)
                .storageKey(key)
                .declaredContentType(file.getContentType())
                .detectedContentType(detectedContentType)
                .sizeBytes(bytes.length)
                .sha256(sha256)
                .status(DocumentStatus.PENDING)
                .uploadComment(uploadComment)
                .uploadedAt(LocalDateTime.now())
                .build();
        return toDto(documentRepository.save(document));
    }

    @Transactional(readOnly = true)
    public List<DocumentUploadResponse> list(Applicant applicant) {
        return documentRepository.findByApplicantOrderByUploadedAtDesc(applicant).stream()
                .map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<DocumentUploadResponse> listForAdmin(Applicant applicant) {
        return listOf(applicant).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<DocumentUploadResponse> listPending() {
        return documentRepository.findByStatus(DocumentStatus.PENDING).stream().map(this::toDto).toList();
    }

    @Transactional
    public FileDownload download(Applicant applicant, Long documentId) {
        ApplicantDocument document = documentRepository.findByIdAndApplicant(documentId, applicant)
                .orElseThrow(() -> new ForbiddenOperationException("El documento no pertenece al postulante"));
        return downloadAndRegister(document);
    }

    @Transactional
    public FileDownload adminDownload(Long documentId) {
        ApplicantDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento no encontrado: " + documentId));
        return downloadAndRegister(document);
    }

    private List<ApplicantDocument> listOf(Applicant applicant) {
        return documentRepository.findByApplicantOrderByUploadedAtDesc(applicant);
    }

    @Transactional
    public DocumentUploadResponse review(Long documentId, String reviewedBy, DocumentReviewRequest request) {
        ApplicantDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento no encontrado: " + documentId));
        DocumentStatus status;
        try {
            status = DocumentStatus.valueOf(request.getStatus().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleViolationException(
                    "Estado de revision no valido. Valores aceptados: " + List.of(DocumentStatus.values()));
        }
        document.setStatus(status);
        document.setReviewComment(request.getComment());
        document.setReviewedBy(reviewedBy);
        document.setReviewedAt(LocalDateTime.now());
        return toDto(documentRepository.save(document));
    }

    @Transactional
    public void delete(Applicant applicant, Long documentId) {
        ApplicantDocument document = documentRepository.findByIdAndApplicant(documentId, applicant)
                .orElseThrow(() -> new ForbiddenOperationException("El documento no pertenece al postulante"));
        if (document.getStatus() != DocumentStatus.PENDING) {
            throw new BusinessRuleViolationException(
                    "Solo se puede eliminar un documento en estado "
                            + DocumentStatus.PENDING + " antes de la revision");
        }
        try {
            storageAdapter.delete(document.getStorageKey());
        } catch (IOException e) {
            log.warn("no se pudo eliminar el objeto {} del almacenamiento", document.getStorageKey(), e);
        }
        documentRepository.delete(document);
    }

    private FileDownload downloadAndRegister(ApplicantDocument document) {
        byte[] bytes;
        try {
            bytes = storageAdapter.read(document.getStorageKey());
        } catch (IOException e) {
            throw new IllegalStateException("No fue posible leer el archivo " + document.getStorageKey(), e);
        }
        document.setDownloadCount(document.getDownloadCount() + 1);
        document.setLastDownloadAt(LocalDateTime.now());
        documentRepository.save(document);
        return FileDownload.builder()
                .content(bytes)
                .contentType(document.getDetectedContentType())
                .fileName(document.getOriginalName())
                .build();
    }

    @Transactional(readOnly = true)
    public String presignedUrl(ApplicantDocument document) {
        return storageAdapter.presignedGetUrl(document.getStorageKey(),
                Duration.ofMinutes(files.getStorage().getPresignTtlMinutes()));
    }

    /** Deteccion de tipo por magic bytes; el tipo declarado por el cliente no se confia. */
    public java.util.Optional<String> detectMimeType(byte[] bytes) {
        if (bytes == null || bytes.length < 4) {
            return java.util.Optional.empty();
        }
        if (bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46) {
            return java.util.Optional.of(MIME_PDF);
        }
        if (startsWith(bytes, MAGIC_JPEG)) {
            return java.util.Optional.of(MIME_JPEG);
        }
        if (startsWith(bytes, MAGIC_PNG)) {
            return java.util.Optional.of(MIME_PNG);
        }
        return java.util.Optional.empty();
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }

    private String extensionOf(String name) {
        int dot = name.lastIndexOf('.');
        if (dot < 0) return "";
        return name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private boolean extensionOf(String extension, String detectedContentType) {
        return (MIME_PDF.equals(detectedContentType) && "pdf".equals(extension))
                || (MIME_PNG.equals(detectedContentType) && "png".equals(extension))
                || (MIME_JPEG.equals(detectedContentType) && ("jpg".equals(extension) || "jpeg".equals(extension)));
    }

    private String keyFor(Applicant applicant, String extension) {
        return "documents/" + applicant.getId() + "/" + UUID.randomUUID() + "." + extension;
    }

    private String sanitize(String name) {
        if (name == null || name.isBlank()) {
            return "archivo";
        }
        String cleaned = name.replace('\\', '_').replace('/', '_')
                .replaceAll("[\\r\\n]", "_")
                .replaceAll("[<>:\"|?*]", "_")
                .strip();
        return cleaned.length() > 255 ? cleaned.substring(0, 255) : cleaned;
    }

    private String sha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible en el JVM", e);
        }
    }

    private DocumentUploadResponse toDto(ApplicantDocument d) {
        return DocumentUploadResponse.builder()
                .id(d.getId())
                .documentType(d.getDocumentType())
                .originalName(d.getOriginalName())
                .storageKey(d.getStorageKey())
                .declaredContentType(d.getDeclaredContentType())
                .detectedContentType(d.getDetectedContentType())
                .sizeBytes(d.getSizeBytes())
                .sha256(d.getSha256())
                .status(d.getStatus())
                .uploadComment(d.getUploadComment())
                .reviewedBy(d.getReviewedBy())
                .reviewComment(d.getReviewComment())
                .uploadedAt(d.getUploadedAt())
                .reviewedAt(d.getReviewedAt())
                .downloadCount(d.getDownloadCount())
                .lastDownloadAt(d.getLastDownloadAt())
                .build();
    }
}