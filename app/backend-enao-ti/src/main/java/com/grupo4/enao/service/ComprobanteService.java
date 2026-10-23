package com.grupo4.enao.service;

import com.grupo4.enao.dto.ComprobanteVerificationResponse;
import com.grupo4.enao.dto.FileDownload;
import com.grupo4.enao.storage.ObjectStorageAdapter;
import com.grupo4.enao.exception.BusinessRuleViolationException;
import com.grupo4.enao.exception.ResourceNotFoundException;
import com.grupo4.enao.model.Applicant;
import com.grupo4.enao.model.Comprobante;
import com.grupo4.enao.model.ComprobanteState;
import com.grupo4.enao.repository.ComprobanteRepository;
import com.grupo4.enao.service.pdf.MinimalPdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Comprobante de inscripcion descargable (RF-04). Genera un PDF sin
 * dependencias externas, guarda una copia en el almacenamiento de objetos y
 * deja registro con serial y hash para poder verificarlo despues.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComprobanteService {

    private final ComprobanteRepository comprobanteRepository;
    private final ObjectStorageAdapter storageAdapter;

    @Transactional
    public FileDownload issue(Applicant applicant) {
        if (!"VALIDATED".equalsIgnoreCase(String.valueOf(applicant.getApplicationData().getStatus()))) {
            throw new BusinessRuleViolationException(
                    "La inscripcion no se puede emitir en el estado " + applicant.getApplicationData().getStatus()
                            + ". Solo se emite con VALIDATED.");
        }

        String period = nullToDash(applicant.getApplicationData().getPeriod());
        String campus = nullToDash(applicant.getApplicationData().getCampus());
        String institution = nullToDash(applicant.getApplicationData().getUniversity());
        String enrollmentStatus = String.valueOf(applicant.getApplicationData().getStatus());

        var existing = comprobanteRepository
                .findFirstByApplicantAndStateOrderByGeneratedAtDesc(applicant, ComprobanteState.ACTIVE);
        if (existing.isPresent()) {
            return downloadBytes(existing.get());
        }

        String serial = UUID.randomUUID().toString();
        byte[] pdf = renderPdf(applicant, serial, period, campus, institution, enrollmentStatus);
        String sha256 = sha256(pdf);
        String key = "comprobantes/" + applicant.getId() + "/" + serial + ".pdf";

        try {
            storageAdapter.store(key, pdf, "application/pdf");
        } catch (IOException e) {
            log.error("no se pudo almacenar el comprobante {} en {}", serial, key, e);
            throw new IllegalStateException("No fue posible almacenar el comprobante", e);
        }

        Comprobante saved = comprobanteRepository.save(Comprobante.builder()
                .applicant(applicant)
                .serial(serial)
                .sha256(sha256)
                .storageKey(key)
                .period(period)
                .campus(campus)
                .institution(institution)
                .enrollmentStatus(enrollmentStatus)
                .generatedAt(LocalDateTime.now())
                .state(ComprobanteState.ACTIVE)
                .build());
        log.debug("comprobante {} generado para el postulante {}", saved.getSerial(), applicant.getId());
        return FileDownload.builder()
                .content(pdf)
                .contentType("application/pdf")
                .fileName("comprobante-" + serial + ".pdf")
                .build();
    }

    @Transactional
    public FileDownload downloadForSerial(String serial) {
        Comprobante comprobante = comprobanteRepository.findBySerial(serial)
                .orElseThrow(() -> new ResourceNotFoundException("Comprobante no encontrado: " + serial));
        return downloadBytes(comprobante);
    }

    @Transactional(readOnly = true)
    public ComprobanteVerificationResponse verify(String serial) {
        Comprobante comprobante = comprobanteRepository.findBySerial(serial)
                .orElseThrow(() -> new ResourceNotFoundException("Comprobante no encontrado: " + serial));
        return ComprobanteVerificationResponse.builder()
                .serial(comprobante.getSerial())
                .valid(comprobante.getState() == ComprobanteState.ACTIVE)
                .state(String.valueOf(comprobante.getState()))
                .period(comprobante.getPeriod())
                .campus(comprobante.getCampus())
                .institution(comprobante.getInstitution())
                .generatedAt(comprobante.getGeneratedAt())
                .sha256Prefix(comprobante.getSha256().substring(0, Math.min(8, comprobante.getSha256().length())))
                .build();
    }

    @Transactional
    public void revoke(String serial, String reviewer) {
        Comprobante comprobante = comprobanteRepository.findBySerial(serial)
                .orElseThrow(() -> new ResourceNotFoundException("Comprobante no encontrado: " + serial));
        if (comprobante.getState() == ComprobanteState.ANNULLED) {
            throw new BusinessRuleViolationException("El comprobante ya esta anulado");
        }
        comprobante.setState(ComprobanteState.ANNULLED);
        comprobante.setAnnulledAt(LocalDateTime.now());
        comprobanteRepository.save(comprobante);
        log.debug("comprobante {} anulado por {}", serial, reviewer);
    }

    // ------------------------------------------------------------------- helpers

    private FileDownload downloadBytes(Comprobante comprobante) {
        byte[] bytes;
        try {
            bytes = storageAdapter.read(comprobante.getStorageKey());
        } catch (IOException e) {
            throw new IllegalStateException("No fue posible leer el comprobante " + comprobante.getSerial(), e);
        }
        return FileDownload.builder()
                .content(bytes)
                .contentType("application/pdf")
                .fileName("comprobante-" + comprobante.getSerial() + ".pdf")
                .build();
    }

    private byte[] renderPdf(Applicant applicant, String serial, String period,
                             String campus, String institution, String enrollmentStatus) {
        String code = applicant.getDocNumber();
        String fullName = applicant.getFullName();
        String docType = applicant.getDocType();
        String createdAt = String.valueOf(applicant.getCreatedAt());
        return MinimalPdfWriter.builder()
                .title("Comprobante de inscripcion - ENAO ASPEFO")
                .subtitle("Documento generado automaticamente por el backend")
                .separator()
                .heading("Datos de la inscripcion")
                .line("Codigo de inscripcion: " + code)
                .line("Nombre completo: " + fullName)
                .line("Tipo y numero de documento: " + docType + " " + code)
                .line("Periodo: " + period)
                .line("Sede: " + campus)
                .line("Institucion: " + institution)
                .line("Estado de la inscripcion: " + enrollmentStatus)
                .line("Fecha y hora de inscripcion: " + createdAt)
                .separator()
                .heading("Verificacion del documento")
                .line("Numero de serie: " + serial)
                .line("Verificar en: /api/comprobantes/" + serial)
                .line("El PDF no incluye datos personales adicionales a los de la inscripcion.")
                .separator()
                .footer("COPIA OFICIAL - ASPEFO - Sistema ENAO")
                .build();
    }

    private String sha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible en el JVM", e);
        }
    }

    private String nullToDash(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}