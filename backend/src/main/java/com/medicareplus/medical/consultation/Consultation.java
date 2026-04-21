package com.medicareplus.medical.consultation;

import com.medicareplus.appointment.Appointment;
import com.medicareplus.common.model.BaseEntity;
import com.medicareplus.medical.analysis.MedicalAnalysis;
import com.medicareplus.medical.prescription.Prescription;
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
