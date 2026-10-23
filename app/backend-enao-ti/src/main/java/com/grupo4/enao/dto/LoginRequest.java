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
public class LoginRequest {

    @NotBlank(message = "El número de documento es obligatorio")
    private String docNumber;

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;
}
