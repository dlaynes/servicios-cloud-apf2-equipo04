package com.grupo4.enao.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

/**
 * Respuesta publica de la verificacion de un comprobante (RF-04). Por la Ley
 * N.o 29733 no expone datos personales: solo confirma si el serial existe.
 */
@Value
@Builder
public class ComprobanteVerificationResponse {

    String serial;
    boolean valid;
    String state;
    String period;
    String campus;
    String institution;
    LocalDateTime generatedAt;
    /** prefijo del hash, para que un tercero confirme integridad sin leer el PDF. */
    String sha256Prefix;
}