package com.medicareplus.medical.analysis;

import java.util.List;

public interface MedicalAnalysisService {

    MedicalAnalysisResponse createAnalysis(MedicalAnalysisRequest request);

    MedicalAnalysisResponse getAnalysisById(Long id);

    List<MedicalAnalysisResponse> getAllAnalyses();

    MedicalAnalysisResponse updateAnalysis(Long id, MedicalAnalysisRequest request);

    List<MedicalAnalysisResponse> getAnalysesByPatientId(Long patientId);

    List<MedicalAnalysisResponse> getAnalysesByDoctorId(Long doctorId);

    void deleteAnalysis(Long id);
}
