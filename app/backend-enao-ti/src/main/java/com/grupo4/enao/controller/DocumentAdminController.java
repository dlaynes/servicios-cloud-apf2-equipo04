package com.grupo4.enao.controller;

import com.grupo4.enao.dto.DocumentReviewRequest;
import com.grupo4.enao.dto.DocumentUploadResponse;
import com.grupo4.enao.dto.FileDownload;
import com.grupo4.enao.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Revision de documentos por parte del administrador (RF-03). Restringido con
 * @PreAuthorize a los roles ADMIN y MAINTAINER, siguiendo el patron de
 * AdminController.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class DocumentAdminController {

    private final DocumentService documentService;

    @GetMapping("/documents/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTAINER')")
    public ResponseEntity<List<DocumentUploadResponse>> listPending() {
        return ResponseEntity.ok(documentService.listPending());
    }

    @GetMapping("/documents/{documentId}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTAINER')")
    public ResponseEntity<byte[]> download(@PathVariable Long documentId) {
        FileDownload download = documentService.adminDownload(documentId);
        return DocumentController.respond(download);
    }

    @PutMapping("/documents/{documentId}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTAINER')")
    public ResponseEntity<DocumentUploadResponse> review(@PathVariable Long documentId,
                                                         @Valid @RequestBody DocumentReviewRequest request,
                                                         Authentication authentication) {
        String reviewer = authentication.getName();
        log.debug("revision del documento {} por {}", documentId, reviewer);
        return ResponseEntity.ok(documentService.review(documentId, reviewer, request));
    }
}