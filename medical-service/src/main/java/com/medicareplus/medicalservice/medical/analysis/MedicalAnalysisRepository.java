package com.medicareplus.medicalservice.medical.analysis;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalAnalysisRepository extends JpaRepository<MedicalAnalysis, Long> {

    List<MedicalAnalysis> findByPatientId(Long patientId);

    List<MedicalAnalysis> findByDoctorId(Long doctorId);

    List<MedicalAnalysis> findByConsultationId(Long consultationId);
}