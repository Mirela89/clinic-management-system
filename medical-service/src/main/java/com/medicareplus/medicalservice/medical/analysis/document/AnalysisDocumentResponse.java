package com.medicareplus.medicalservice.medical.analysis.document;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AnalysisDocumentResponse {
    private String id;
    private Long analysisId;
    private Long patientId;
    private Long doctorId;
    private String analysisType;
    private List<AnalysisResult> results;
    private String notes;
    private LocalDate createdAt;
}