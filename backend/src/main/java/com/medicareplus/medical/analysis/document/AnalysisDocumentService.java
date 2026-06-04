package com.medicareplus.medical.analysis.document;

import java.util.List;
import java.util.Optional;

public interface AnalysisDocumentService {
    AnalysisDocumentResponse saveDocument(AnalysisDocumentRequest request);

    Optional<AnalysisDocumentResponse> getByAnalysisId(Long analysisId);

    List<AnalysisDocumentResponse> getByPatientId(Long patientId);

    List<AnalysisDocumentResponse> getByDoctorId(Long doctorId);
}