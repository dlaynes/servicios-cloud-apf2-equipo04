package com.grupo4.enao.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicantRequest {

    @NotBlank(message = "El nombre completo es obligatorio")
    private String fullName;

    @NotBlank(message = "El tipo de documento es obligatorio")
    private String docType;

    @NotBlank(message = "El número de documento es obligatorio")
    private String docNumber;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El correo electrónico no es válido")
    private String email;

    private String phone;
    private String emergencyContact;
    private String emergencyPhone;
    private String address;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;

    private Boolean internationalUniversity;
    private String university;
    private String country;
    private String otherUniversity;

    @NotBlank(message = "La organización auspiciadora es obligatoria")
    private String organization;

    @NotBlank(message = "El banco es obligatorio")
    private String bank;

    @NotBlank(message = "El código de recibo es obligatorio")
    private String receiptCode;

    /** period academico, opcional (RF-08). */
    @Size(max = 20)
    private String period;

    /** sede, opcional (RF-08). */
    @Size(max = 50)
    private String campus;

}
