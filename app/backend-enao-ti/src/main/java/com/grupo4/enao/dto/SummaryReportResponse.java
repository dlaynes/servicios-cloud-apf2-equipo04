package com.grupo4.enao.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

/** Indicadores resumidos del panel administrativo (RF-08). */
@Value
@Builder
public class SummaryReportResponse {

    long totalApplicants;
    long totalVerified;
    long totalRejected;
    long totalPending;
    long totalDocuments;
    long totalComprobantes;
    long totalActive;
    long totalAnnulled;
    Double averageScore;
    Double maximumScore;
    Double minimumScore;
    List<ReportAggregationRow> byStatus;
    List<ReportAggregationRow> byPeriod;
    List<ReportAggregationRow> byCampus;
    List<ReportAggregationRow> byInstitution;
}