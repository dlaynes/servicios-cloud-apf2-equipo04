package com.grupo4.enao.controller;

import com.grupo4.enao.dto.ApplicantProfileResponse;
import com.grupo4.enao.dto.ApplicantRequest;
import com.grupo4.enao.dto.ApplicantUpdateRequest;
import com.grupo4.enao.service.ApplicantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/applicants")
@RequiredArgsConstructor
public class ApplicantController {

    private final ApplicantService applicantService;

    @PostMapping
    public ResponseEntity<ApplicantProfileResponse> register(@Valid @RequestBody ApplicantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(applicantService.register(request));
    }

    @GetMapping("/me")
    public ResponseEntity<ApplicantProfileResponse> getMe() {
        return ResponseEntity.ok(applicantService.getCurrentProfile());
    }

    @PutMapping("/me")
    public ResponseEntity<ApplicantProfileResponse> updateMe(@Valid @RequestBody ApplicantUpdateRequest request) {
        return ResponseEntity.ok(applicantService.updateCurrentProfile(request));
    }
}
