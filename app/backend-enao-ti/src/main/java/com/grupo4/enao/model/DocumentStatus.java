package com.grupo4.enao.model;

/**
 * Ciclo de vida de un documento adjunto (RF-03). El estado se muestra al
 * postulante y queda disponible para la revision del administrador.
 */
public enum DocumentStatus {
    PENDING,
    APPROVED,
    REJECTED
}