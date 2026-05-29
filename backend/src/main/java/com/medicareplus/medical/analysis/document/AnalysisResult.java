package com.medicareplus.medical.analysis.document;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AnalysisResult {
    private String parameter;
    private String value;
    private String unit;
    private String normalRange;
    private String status; // NORMAL, HIGH, LOW
}