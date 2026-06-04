package com.medicareplus.medicalservice.medical.medication;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MedicationRequest {

    @NotBlank(message = "Medication name is required.")
    private String name;

    private String activeSubstance;

    @NotBlank(message = "Dosage is required.")
    private String dosage;

    private String manufacturer;
}
