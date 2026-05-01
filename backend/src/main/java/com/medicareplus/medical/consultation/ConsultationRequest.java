package com.medicareplus.medical.consultation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ConsultationRequest {

    @NotBlank(message = "Diagnosis is required.")
    private String diagnosis;

    private String notes;

    @NotNull(message = "Consultation date is required.")
    private LocalDateTime consultationDate;

    @NotNull(message = "Appointment ID is required.")
    private Long appointmentId;
}
