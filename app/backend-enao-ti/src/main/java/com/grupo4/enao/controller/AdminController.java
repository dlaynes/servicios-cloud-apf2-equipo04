package com.grupo4.enao.controller;

import com.grupo4.enao.dto.*;
import com.grupo4.enao.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/applicants")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTAINER')")
    public ResponseEntity<List<ApplicantFullResponse>> listApplicants() {
        return ResponseEntity.ok(adminService.listApplicants());
    }

    @GetMapping("/applicants/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTAINER')")
    public ResponseEntity<ApplicantFullResponse> getApplicant(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getApplicant(id));
    }

    @PutMapping("/applicants/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTAINER')")
    public ResponseEntity<ApplicantFullResponse> updateApplicantStatus(
            @PathVariable Long id,
            @Valid @RequestBody ApplicantStatusUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateApplicantStatus(id, request));
    }

    @GetMapping("/applicants/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTAINER')")
    public ResponseEntity<List<ApplicantFullResponse>> searchByDocNumber(@RequestParam String docNumber) {
        return ResponseEntity.ok(adminService.searchApplicantsByDocNumber(docNumber));
    }

    @PutMapping("/applicants/{id}/results")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTAINER')")
    public ResponseEntity<ExamResultResponse> updateResult(
            @PathVariable Long id,
            @Valid @RequestBody ResultUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateResult(id, request));
    }
}
