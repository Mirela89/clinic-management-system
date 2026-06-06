package com.medicareplus.medicalservice.medical.analysis;

import com.medicareplus.medicalservice.common.model.BaseEntity;
import com.medicareplus.medicalservice.medical.analysis.AnalysisStatus;
import com.medicareplus.medicalservice.medical.consultation.Consultation;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "medical_analyses")
@Getter
@Setter
public class MedicalAnalysis extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    @ManyToOne
    @JoinColumn(name = "consultation_id")
    private Consultation consultation;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "analysis_type", nullable = false)
    private AnalysisType analysisType;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnalysisStatus status;

    @NotNull
    @Column(name = "requested_date", nullable = false)
    private LocalDate requestedDate;

    @Column(name = "result_date")
    private LocalDate resultDate;

    @Column(name = "mongo_document_id")
    private String mongoDocumentId;
}