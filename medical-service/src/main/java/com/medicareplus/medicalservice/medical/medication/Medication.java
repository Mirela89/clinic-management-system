package com.medicareplus.medicalservice.medical.medication;

import com.medicareplus.medicalservice.medical.prescription.PrescriptionMedication;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "medications")
@Getter
@Setter
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Column(name = "active_substance")
    private String activeSubstance;

    @NotBlank
    @Column(nullable = false)
    private String dosage;

    @Column
    private String manufacturer;

    // Relatie inversa
    @OneToMany(mappedBy = "medication")
    private List<PrescriptionMedication> prescriptionMedications;
}