package com.medicareplus.medical.prescription;

import com.medicareplus.medical.medication.Medication;
import com.medicareplus.medical.medication.MedicationFrequency;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "prescription_medications")
@Getter
@Setter
public class PrescriptionMedication {

    @EmbeddedId
    private PrescriptionMedicationId id;

    @ManyToOne
    @MapsId("prescriptionId")
    @JoinColumn(name = "prescription_id")
    private Prescription prescription;

    @ManyToOne
    @MapsId("medicationId")
    @JoinColumn(name = "medication_id")
    private Medication medication;

    @Min(1)
    @Column
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column
    private MedicationFrequency frequency;

    @Min(1)
    @Column(name = "duration_days")
    private Integer durationDays;
}