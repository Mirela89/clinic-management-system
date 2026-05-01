package com.medicareplus.medical.prescription;

import com.medicareplus.common.model.BaseEntity;
import com.medicareplus.medical.consultation.Consultation;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "prescriptions")
@Getter
@Setter
public class Prescription extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @NotNull
    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column
    private String instructions;

    // O prescriptie este legata de o singura consultatie, dar o consultatie poate avea mai multe prescriptii
    @NotNull
    @ManyToOne
    @JoinColumn(name = "consultation_id", nullable = false)
    private Consultation consultation;

    // O prescriptie poate avea mai multe medicamente, iar un medicament poate fi prescris in mai multe prescriptii
    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PrescriptionMedication> prescriptionMedications;
}
