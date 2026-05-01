package com.medicareplus.medical.analysis;

import java.util.List;

public interface MedicalAnalysisService {

    MedicalAnalysisResponse createAnalysis(MedicalAnalysisRequest request);

    MedicalAnalysisResponse getAnalysisById(Long id);

    List<MedicalAnalysisResponse> getAllAnalyses();

    MedicalAnalysisResponse updateAnalysis(Long id, MedicalAnalysisRequest request);

    void deleteAnalysis(Long id);
}
