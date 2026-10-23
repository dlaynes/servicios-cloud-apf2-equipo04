package com.grupo4.enao.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResultUpdateRequest {
    @NotNull(message = "El puntaje es obligatorio")
    private Double score;

    @NotNull(message = "El puntaje máximo es obligatorio")
    private Double maximumScore;

    @NotBlank(message = "El estado es obligatorio")
    private String status; // NOT_AVAILABLE, PUBLISHED, ANNULLED
}
