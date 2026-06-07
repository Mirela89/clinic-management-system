package com.medicareplus.medicalservice.medical.analysis.document;

import com.medicareplus.medicalservice.medical.analysis.document.AnalysisDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnalysisDocumentRepository extends MongoRepository<AnalysisDocument, String> {
    List<AnalysisDocument> findByPatientId(Long patientId);

    List<AnalysisDocument> findByAnalysisId(Long analysisId);

    List<AnalysisDocument> findByDoctorId(Long doctorId);

    Optional<AnalysisDocument> findFirstByAnalysisId(Long analysisId);
}