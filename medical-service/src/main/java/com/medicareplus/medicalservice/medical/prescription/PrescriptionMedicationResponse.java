package com.medicareplus.medicalservice.medical.prescription;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PrescriptionMedicationResponse {

    private Long medicationId;
    private String medicationName;
    private String dosage;
    private Integer quantity;
    private String frequency;
    private Integer durationDays;
}
