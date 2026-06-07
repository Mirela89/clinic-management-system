package com.medicareplus.medicalservice.medical.analysis.document;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnalysisResultRequest {
    @NotBlank
    private String parameter;
    @NotBlank
    private String value;
    private String unit;
    private String normalRange;
    private String status;
}