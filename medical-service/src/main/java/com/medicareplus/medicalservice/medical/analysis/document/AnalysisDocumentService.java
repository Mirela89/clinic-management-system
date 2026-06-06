package com.medicareplus.medicalservice.medical.analysis.document;

import com.medicareplus.medicalservice.medical.analysis.document.AnalysisDocumentResponse;

import java.util.List;
import java.util.Optional;

public interface AnalysisDocumentService {
    AnalysisDocumentResponse saveDocument(AnalysisDocumentRequest request);

    Optional<AnalysisDocumentResponse> getByAnalysisId(Long analysisId);

    List<AnalysisDocumentResponse> getByPatientId(Long patientId);

    List<AnalysisDocumentResponse> getByDoctorId(Long doctorId);
}