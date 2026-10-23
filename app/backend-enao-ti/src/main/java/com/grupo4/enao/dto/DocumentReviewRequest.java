package com.grupo4.enao.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Cuerpo de la revision de un documento por parte de un administrador. */
@Data
public class DocumentReviewRequest {

    @NotBlank
    @Size(max = 20)
    private String status;

    @Size(max = 500)
    private String comment;
}