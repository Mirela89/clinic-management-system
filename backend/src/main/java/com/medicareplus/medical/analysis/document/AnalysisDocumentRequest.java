package com.medicareplus.medical.analysis.document;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AnalysisDocumentRequest {
    @NotNull
    private Long analysisId;
    @NotNull
    private Long patientId;
    @NotNull
    private Long doctorId;
    private String analysisType;
    private List<AnalysisResultRequest> results;
    private String notes;
}