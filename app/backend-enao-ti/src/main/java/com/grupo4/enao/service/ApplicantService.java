package com.grupo4.enao.service;

import com.grupo4.enao.dto.*;
import com.grupo4.enao.model.Applicant;
import com.grupo4.enao.model.ApplicationData;
import com.grupo4.enao.repository.ApplicantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApplicantService {

    private final ApplicantRepository applicantRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public ApplicantProfileResponse register(ApplicantRequest request) {
        if (applicantRepository.existsByDocNumber(request.getDocNumber())) {
            throw new IllegalArgumentException("Ya existe un postulante registrado con el documento " + request.getDocNumber());
        }
        if (applicantRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Ya existe un postulante registrado con el correo " + request.getEmail());
        }

        Applicant applicant = ApplicantMapper.toEntity(request);
        applicant.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        Applicant saved = applicantRepository.save(applicant);
        return ApplicantMapper.toProfile(saved);
    }

    @Transactional(readOnly = true)
    public ApplicantProfileResponse getCurrentProfile() {
        return ApplicantMapper.toProfile(getCurrentApplicant());
    }

    @Transactional
    public ApplicantProfileResponse updateCurrentProfile(ApplicantUpdateRequest request) {
        Applicant applicant = getCurrentApplicant();
        ApplicantMapper.updateEntity(applicant, request);
        return ApplicantMapper.toProfile(applicantRepository.save(applicant));
    }

    public Applicant getCurrentApplicant() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String docNumber;
        if (principal instanceof UserDetails userDetails) {
            docNumber = userDetails.getUsername();
        } else {
            docNumber = principal.toString();
        }

        return applicantRepository.findByDocNumber(docNumber)
                .orElseThrow(() -> new IllegalArgumentException("Postulante no encontrado"));
    }
}
