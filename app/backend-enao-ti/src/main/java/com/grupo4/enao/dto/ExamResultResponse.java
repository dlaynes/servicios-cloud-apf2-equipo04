package com.grupo4.enao.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamResultResponse {

    private boolean available;
    private Double score;
    private Double maximumScore;
    private String status;
    private String message;
    private String publishedAt;
}
