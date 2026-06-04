package com.medicareplus.medicalservice.medical.prescription;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class PrescriptionRequest {

    @NotNull(message = "Issue date is required.")
    private LocalDate issueDate;

    @NotNull(message = "Expiry date is required.")
    private LocalDate expiryDate;

    private String instructions;

    @NotNull(message = "Consultation ID is required.")
    private Long consultationId;

    @Valid
    private List<PrescriptionMedicationRequest> medications;
}
