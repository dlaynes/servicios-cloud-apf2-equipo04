package com.grupo4.enao.controller;

import com.grupo4.enao.dto.ExamResultResponse;
import com.grupo4.enao.service.ExamResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/results")
@RequiredArgsConstructor
public class ResultController {

    private final ExamResultService examResultService;

    @GetMapping("/me")
    public ResponseEntity<ExamResultResponse> getMyResult() {
        return ResponseEntity.ok(examResultService.getCurrentResult());
    }
}
