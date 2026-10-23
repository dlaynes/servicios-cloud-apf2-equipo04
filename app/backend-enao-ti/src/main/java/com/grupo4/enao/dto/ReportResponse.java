package com.grupo4.enao.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

/** Respuesta de un reporte de RF-08, con sus filtros y sus totales. */
@Value
@Builder
public class ReportResponse {

    String dimension;
    List<ReportFilter> filters;
    List<ReportAggregationRow> rows;
    long totalCount;
    Double averageScore;

    @Value
    @Builder
    public static class ReportFilter {
        String name;
        String value;
    }
}