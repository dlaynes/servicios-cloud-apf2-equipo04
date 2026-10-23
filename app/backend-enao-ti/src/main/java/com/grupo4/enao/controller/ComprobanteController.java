package com.grupo4.enao.controller;

import com.grupo4.enao.dto.ComprobanteVerificationResponse;
import com.grupo4.enao.dto.FileDownload;
import com.grupo4.enao.model.Applicant;
import com.grupo4.enao.service.ApplicantService;
import com.grupo4.enao.service.ComprobanteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Comprobante de inscripcion (RF-04). La emision y la descarga son para el
 * postulante y para el administrador; la verificacion por serial es publica
 * para que terceros puedan confirmar si un comprobante sigue vigente.
 */
@RestController
@RequiredArgsConstructor
public class ComprobanteController {

    private final ComprobanteService comprobanteService;
    private final ApplicantService applicantService;

    @GetMapping("/api/me/comprobante.pdf")
    public ResponseEntity<byte[]> downloadForMe() {
        Applicant applicant = applicantService.getCurrentApplicant();
        FileDownload download = comprobanteService.issue(applicant);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + download.getFileName() + "\"")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(download.getContent());
    }

    @GetMapping("/api/admin/comprobantes/{serial}.pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTAINER')")
    public ResponseEntity<byte[]> downloadForAdmin(@PathVariable String serial) {
        FileDownload download = comprobanteService.downloadForSerial(serial);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + download.getFileName() + "\"")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(download.getContent());
    }

    @GetMapping("/api/comprobantes/{serial}")
    public ResponseEntity<ComprobanteVerificationResponse> verify(@PathVariable String serial) {
        return ResponseEntity.ok(comprobanteService.verify(serial));
    }

    @PutMapping("/api/admin/comprobantes/{serial}/revoke")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> revoke(@PathVariable String serial, Authentication authentication) {
        comprobanteService.revoke(serial, authentication.getName());
        return ResponseEntity.ok(Map.of("serial", serial, "state", "ANNULLED"));
    }
}