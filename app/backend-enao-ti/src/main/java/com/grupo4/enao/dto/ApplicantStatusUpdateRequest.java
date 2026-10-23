package com.grupo4.enao.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicantStatusUpdateRequest {
    @NotBlank(message = "El estado es obligatorio")
    private String status; // PENDING, VALIDATED, REJECTED
}
