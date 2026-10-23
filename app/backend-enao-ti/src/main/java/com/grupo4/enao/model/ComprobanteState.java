package com.grupo4.enao.model;

/**
 * Estado de un comprobante de inscripcion (RF-04). Se conserva independiente
 * del estado de la inscripcion para que el documento emitido quede trazable
 * incluso si la inscripcion cambia de estado.
 */
public enum ComprobanteState {
    ACTIVE,
    ANNULLED
}