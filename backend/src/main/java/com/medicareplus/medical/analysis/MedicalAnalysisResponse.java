package com.medicareplus.medical.analysis;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MedicalAnalysisResponse {

    private Long id;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private Long consultationId;
    private String analysisType;
    private String status;
    private LocalDate requestedDate;
    private LocalDate resultDate;
    private String mongoDocumentId;
}
