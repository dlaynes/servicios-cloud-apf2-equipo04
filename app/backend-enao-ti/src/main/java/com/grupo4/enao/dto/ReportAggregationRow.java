package com.grupo4.enao.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** Fila agregada de un reporte de RF-08: una etiqueta y su conteo. */
@Getter
@AllArgsConstructor
public class ReportAggregationRow {

    private final String label;
    private final Long count;
    private final Double extra;
}