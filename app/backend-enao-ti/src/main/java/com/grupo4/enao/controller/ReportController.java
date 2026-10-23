package com.grupo4.enao.controller;

import com.grupo4.enao.dto.ReportResponse;
import com.grupo4.enao.dto.SummaryReportResponse;
import com.grupo4.enao.config.ReportsProperties;
import com.grupo4.enao.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;
import java.util.Map;

/**
 * Reportes agregados (RF-08). Existen tres formatos: JSON, CSV y PDF.
 * Todos se ofrecen a los roles ADMIN y MAINTAINER, sin datos personales.
 */
@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final ReportsProperties reportsProperties;

    @GetMapping("/applicants")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTAINER')")
    public ResponseEntity<?> applicants(
            @RequestParam(name = "group-by", required = false, defaultValue = "status") String groupBy,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "university", required = false) String university,
            @RequestParam(name = "campus", required = false) String campus,
            @RequestParam(name = "period", required = false) String period,
            @RequestParam(name = "format", required = false, defaultValue = "json") String format,
            @RequestParam(name = "size", required = false) Integer size) {
        ReportResponse report = reportService.applicantsReport(groupBy, status, university, campus, period);
        return respond(report, format, size, "reporte-applicants-" + groupBy);
    }

    @GetMapping("/results")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTAINER')")
    public ResponseEntity<?> results(
            @RequestParam(name = "format", required = false, defaultValue = "json") String format,
            @RequestParam(name = "size", required = false) Integer size) {
        ReportResponse report = reportService.resultsReport();
        return respond(report, format, size, "reporte-resultados");
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTAINER')")
    public ResponseEntity<SummaryReportResponse> summary() {
        return ResponseEntity.ok(reportService.summary());
    }

    private ResponseEntity<?> respond(ReportResponse report, String format, Integer size, String fileBase) {
        String normalized = format == null ? "json" : format.toLowerCase(Locale.ROOT);
        if ("csv".equals(normalized)) {
            byte[] bytes = reportService.exportCsv(report);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + fileBase + ".csv\"")
                    .contentType(MediaType.valueOf("text/csv;charset=utf-8"))
                    .body(bytes);
        }
        if ("pdf".equals(normalized)) {
            byte[] bytes = reportService.exportPdf(report);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + fileBase + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(bytes);
        }
        if (size != null && size > reportsProperties.getMaxPageSize()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", "El tamano de pagina maximo es " + reportsProperties.getMaxPageSize()));
        }
        return ResponseEntity.ok(report);
    }
}