package com.grupo4.enao.service;

import com.grupo4.enao.dto.ReportAggregationRow;
import com.grupo4.enao.dto.ReportResponse;
import com.grupo4.enao.dto.SummaryReportResponse;
import com.grupo4.enao.model.ApplicationData.ApplicationStatus;
import com.grupo4.enao.repository.ApplicantDocumentRepository;
import com.grupo4.enao.repository.ComprobanteRepository;
import com.grupo4.enao.repository.ExamResultRepository;
import com.grupo4.enao.repository.ReportRepository;
import com.grupo4.enao.service.pdf.MinimalPdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Reportes agregados de RF-08. Solo devuelve conteos, sin datos personales,
 * para respetar la Ley N.o 29733.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private static final List<String> SUPPORTED_DIMENSIONS = List.of("status", "university", "campus", "period");

    private final ReportRepository reportRepository;
    private final ExamResultRepository examResultRepository;
    private final ApplicantDocumentRepository documentRepository;
    private final ComprobanteRepository comprobanteRepository;

    @Transactional(readOnly = true)
    public ReportResponse applicantsReport(String groupBy, String status, String university,
                                           String campus, String period) {
        if (!SUPPORTED_DIMENSIONS.contains(groupBy == null ? "" : groupBy.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Dimension no soportada. Valores aceptados: "
                    + SUPPORTED_DIMENSIONS);
        }
        ApplicationStatus filteredStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                filteredStatus = ApplicationStatus.valueOf(status.toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Estado no soportado: " + status);
            }
        }

        List<Object[]> raw = switch (groupBy.toLowerCase(Locale.ROOT)) {
            case "status" -> reportRepository.countByStatus(university, campus, period);
            case "university" -> reportRepository.countByUniversity(filteredStatus, campus, period);
            case "campus" -> reportRepository.countByCampus(filteredStatus, period, university);
            case "period" -> reportRepository.countByPeriod(filteredStatus, campus, university);
            default -> throw new IllegalArgumentException("Dimension no soportada");
        };

        List<ReportAggregationRow> rows = new ArrayList<>();
        long total = 0L;
        for (Object[] row : raw) {
            Object key = row[0];
            Long count = (Long) row[1];
            String label = key == null ? "SIN DATO" : String.valueOf(key);
            rows.add(new ReportAggregationRow(label, count, null));
            total += count;
        }
        rows.sort((a, b) -> Long.compare(b.getCount(), a.getCount()));

        List<ReportResponse.ReportFilter> filters = new ArrayList<>();
        if (filteredStatus != null) {
            filters.add(ReportResponse.ReportFilter.builder()
                    .name("status").value(filteredStatus.name()).build());
        }
        if (university != null) {
            filters.add(ReportResponse.ReportFilter.builder()
                    .name("university").value(university).build());
        }
        if (campus != null) {
            filters.add(ReportResponse.ReportFilter.builder()
                    .name("campus").value(campus).build());
        }
        if (period != null) {
            filters.add(ReportResponse.ReportFilter.builder()
                    .name("period").value(period).build());
        }

        return ReportResponse.builder()
                .dimension(groupBy.toLowerCase(Locale.ROOT))
                .filters(filters)
                .rows(rows)
                .totalCount(total)
                .averageScore(null)
                .build();
    }

    @Transactional(readOnly = true)
    public ReportResponse resultsReport() {
        List<Object[]> raw = examResultRepository.countByStatus();
        List<ReportAggregationRow> rows = new ArrayList<>();
        long total = 0;
        for (Object[] row : raw) {
            Object key = row[0];
            Long count = (Long) row[1];
            rows.add(new ReportAggregationRow(key == null ? "SIN DATO" : String.valueOf(key), count, null));
            total += count;
        }
        var summary = examResultRepository.summary().stream().findFirst().orElse(null);
        Double avg = summary == null ? null : (Double) summary[1];
        return ReportResponse.builder()
                .dimension("results")
                .filters(List.of())
                .rows(rows)
                .totalCount(total)
                .averageScore(avg)
                .build();
    }

    @Transactional(readOnly = true)
    public SummaryReportResponse summary() {
        long totalApplicants = reportRepository.totalApplicants();
        var results = examResultRepository.summary().stream().findFirst().orElse(new Object[]{0L, null, null, null});
        long totalDocs = documentRepository.count();
        long totalComprobantes = comprobanteRepository.count();
        long active = comprobanteRepository.findByStateOrderByGeneratedAtDesc(
                com.grupo4.enao.model.ComprobanteState.ACTIVE).size();
        return SummaryReportResponse.builder()
                .totalApplicants(totalApplicants)
                .totalVerified(reportRepository.countByStatus(null, null, null).stream()
                        .filter(r -> "VALIDATED".equalsIgnoreCase(String.valueOf(r[0]))).findFirst()
                        .map(r -> (Long) r[1]).orElse(0L))
                .totalRejected(reportRepository.countByStatus(null, null, null).stream()
                        .filter(r -> "REJECTED".equalsIgnoreCase(String.valueOf(r[0]))).findFirst()
                        .map(r -> (Long) r[1]).orElse(0L))
                .totalPending(reportRepository.countByStatus(null, null, null).stream()
                        .filter(r -> "PENDING".equalsIgnoreCase(String.valueOf(r[0]))).findFirst()
                        .map(r -> (Long) r[1]).orElse(0L))
                .totalDocuments(totalDocs)
                .totalComprobantes(totalComprobantes)
                .totalActive(active)
                .totalAnnulled(totalComprobantes - active)
                .averageScore((Double) results[1])
                .maximumScore((Double) results[2])
                .minimumScore((Double) results[3])
                .byStatus(toRows(reportRepository.countByStatus(null, null, null)))
                .byPeriod(toRows(reportRepository.countByPeriod(null, null, null)))
                .byCampus(toRows(reportRepository.countByCampus(null, null, null)))
                .byInstitution(toRows(reportRepository.countByUniversity(null, null, null)))
                .build();
    }

    private List<ReportAggregationRow> toRows(List<Object[]> rows) {
        return rows.stream()
                .map(r -> new ReportAggregationRow(r[0] == null ? "SIN DATO" : String.valueOf(r[0]), (Long) r[1], null))
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .toList();
    }

    // ------------------------------------------------------------------ export

    public byte[] exportCsv(ReportResponse report) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        StringBuilder sb = new StringBuilder();
        sb.append("valor;conteo\n");
        for (ReportAggregationRow row : report.getRows()) {
            sb.append(csv(row.getLabel())).append(';').append(row.getCount()).append('\n');
        }
        sb.append("TOTAL;").append(report.getTotalCount()).append('\n');
        if (report.getAverageScore() != null) {
            sb.append("promedio;").append(String.format(Locale.ROOT, "%.2f", report.getAverageScore())).append('\n');
        }
        out.writeBytes(sb.toString().getBytes(StandardCharsets.UTF_8));
        return out.toByteArray();
    }

    public byte[] exportPdf(ReportResponse report) {
        MinimalPdfWriter.Builder builder = MinimalPdfWriter.builder()
                .title("Reporte de " + report.getDimension())
                .subtitle("RF-08 - Reportes agregados del modulo ENAO")
                .separator();
        if (!report.getFilters().isEmpty()) {
            builder.heading("Filtros");
            for (ReportResponse.ReportFilter filter : report.getFilters()) {
                builder.line(filter.getName() + ": " + filter.getValue());
            }
        }
        builder.heading("Resultado");
        for (ReportAggregationRow row : report.getRows()) {
            builder.line(row.getLabel() + ": " + row.getCount());
        }
        builder.separator();
        builder.line("TOTAL: " + report.getTotalCount());
        if (report.getAverageScore() != null) {
            builder.line(String.format(Locale.ROOT, "Promedio de notas: %.2f", report.getAverageScore()));
        }
        builder.footer("Generado automaticamente por el backend ENAO (RF-08).");
        return builder.build();
    }

    private String csv(String value) {
        String safe = value == null ? "" : value;
        if (safe.contains(";") || safe.contains("\"") || safe.contains("\n")) {
            return "\"" + safe.replace("\"", "\"\"") + "\"";
        }
        return safe;
    }
}