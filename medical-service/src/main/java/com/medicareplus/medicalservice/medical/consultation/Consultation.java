package com.medicareplus.medicalservice.medical.consultation;

import com.medicareplus.medicalservice.appointment.Appointment;
import com.medicareplus.medicalservice.common.model.BaseEntity;
import com.medicareplus.medicalservice.medical.analysis.MedicalAnalysis;
import com.medicareplus.medicalservice.medical.prescription.Prescription;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "consultations")
@Getter
@Setter
public class Consultation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "doctor_id")
    private Long doctorId;

    @NotBlank
    @Column(nullable = false)
    private String diagnosis;

    @Column
    private String notes;

    @NotNull
    @Column(name = "consultation_date", nullable = false)
    private LocalDateTime consultationDate;

    @OneToOne
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    // Relatie inversa
    @OneToMany(mappedBy = "consultation", cascade = CascadeType.ALL)
    private List<Prescription> prescriptions;

    @OneToMany(mappedBy = "consultation")
    private List<MedicalAnalysis> analyses;
}
