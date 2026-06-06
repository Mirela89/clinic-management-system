package com.medicareplus.userservice.patient;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class PatientRequest {

    @NotNull(message = "User ID is required.")
    private Long userId;

    @NotBlank(message = "CNP is required.")
    @Pattern(regexp = "\\d{13}", message = "CNP must be exactly 13 digits.")
    private String cnp;

    @NotNull(message = "Date of birth is required.")
    private LocalDate dateOfBirth;

    private String address;

    private BloodType bloodType;

    private Long insuranceId;
}
