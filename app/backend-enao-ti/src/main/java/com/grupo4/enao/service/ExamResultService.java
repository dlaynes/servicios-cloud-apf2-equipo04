package com.grupo4.enao.service;

import com.grupo4.enao.dto.ApplicantMapper;
import com.grupo4.enao.dto.ExamResultResponse;
import com.grupo4.enao.model.Applicant;
import com.grupo4.enao.model.ExamResult;
import com.grupo4.enao.repository.ExamResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExamResultService {

    private final ExamResultRepository examResultRepository;
    private final ApplicantService applicantService;

    @Transactional(readOnly = true)
    public ExamResultResponse getCurrentResult() {
        Applicant applicant = applicantService.getCurrentApplicant();
        return examResultRepository.findByApplicant(applicant)
                .map(ApplicantMapper::toResult)
                .orElseGet(() -> ApplicantMapper.toResult(null));
    }

    @Transactional(readOnly = true)
    public ExamResultResponse getResultByDocNumber(String docNumber) {
        return examResultRepository.findByApplicant_DocNumber(docNumber)
                .map(ApplicantMapper::toResult)
                .orElseGet(() -> ApplicantMapper.toResult(null));
    }
}
