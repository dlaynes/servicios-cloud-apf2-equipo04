package com.grupo4.enao.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicantUpdateRequest {

    @NotBlank(message = "La organizacion auspiciadora es obligatoria")
    private String organization;

    @NotBlank(message = "El banco es obligatorio")
    private String bank;

    @NotBlank(message = "El codigo de recibo es obligatorio")
    private String receiptCode;

    /** period academico, opcional (RF-08). */
    @Size(max = 20)
    private String period;

    /** sede, opcional (RF-08). */
    @Size(max = 50)
    private String campus;
}