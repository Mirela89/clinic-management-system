package com.medicareplus.medicalservice.medical.prescription;

import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@EqualsAndHashCode
public class PrescriptionMedicationId implements Serializable {

    private Long prescriptionId;
    private Long medicationId;
}