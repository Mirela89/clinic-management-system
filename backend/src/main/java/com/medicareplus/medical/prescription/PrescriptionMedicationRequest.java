package com.medicareplus.medical.prescription;

import com.medicareplus.medical.medication.MedicationFrequency;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PrescriptionMedicationRequest {

    @NotNull(message = "Medication ID is required.")
    private Long medicationId;

    @Min(value = 1, message = "Quantity must be at least 1.")
    private Integer quantity;

    private MedicationFrequency frequency;

    @Min(value = 1, message = "Duration days must be at least 1.")
    private Integer durationDays;
}
