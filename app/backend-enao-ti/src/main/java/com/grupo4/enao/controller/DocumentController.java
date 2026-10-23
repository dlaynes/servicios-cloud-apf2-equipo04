package com.grupo4.enao.controller;

import com.grupo4.enao.dto.DocumentUploadResponse;
import com.grupo4.enao.dto.FileDownload;
import com.grupo4.enao.model.Applicant;
import com.grupo4.enao.service.ApplicantService;
import com.grupo4.enao.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Endpoints de los documentos adjuntos administrados por el propio
 * postulante (RF-03). Un documento en estado PENDING puede eliminarse antes
 * de la revision; la revision la hace el administrador.
 */
@RestController
@RequestMapping("/api/me/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final ApplicantService applicantService;

    @PostMapping
    public ResponseEntity<DocumentUploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "uploadComment", required = false) String uploadComment) {
        Applicant applicant = applicantService.getCurrentApplicant();
        DocumentUploadResponse response = documentService.upload(applicant, file, documentType, uploadComment);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<DocumentUploadResponse>> list() {
        return ResponseEntity.ok(documentService.list(applicantService.getCurrentApplicant()));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        FileDownload download = documentService.download(applicantService.getCurrentApplicant(), id);
        return respond(download);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        documentService.delete(applicantService.getCurrentApplicant(), id);
        return ResponseEntity.noContent().build();
    }

    static ResponseEntity<byte[]> respond(FileDownload download) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(download.getFileName(), StandardCharsets.UTF_8)
                .build());
        MediaType mediaType = download.getContentType().startsWith("image/")
                ? MediaType.IMAGE_PNG : MediaType.APPLICATION_PDF;
        return ResponseEntity.ok().headers(headers).contentType(mediaType).body(download.getContent());
    }
}