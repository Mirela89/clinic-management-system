package com.medicareplus.medical.analysis;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class MedicalAnalysisRequest {

    @NotNull(message = "Patient ID is required.")
    private Long patientId;

    @NotNull(message = "Doctor ID is required.")
    private Long doctorId;

    private Long consultationId;

    @NotNull(message = "Analysis type is required.")
    private AnalysisType analysisType;

    @NotNull(message = "Analysis status is required.")
    private AnalysisStatus status;

    @NotNull(message = "Requested date is required.")
    private LocalDate requestedDate;

    private LocalDate resultDate;

    private String mongoDocumentId;
}
