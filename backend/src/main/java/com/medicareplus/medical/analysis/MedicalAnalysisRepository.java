package com.medicareplus.medical.analysis;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalAnalysisRepository extends JpaRepository<MedicalAnalysis, Long> {

    List<MedicalAnalysis> findByPatientUserId(Long patientId);

    List<MedicalAnalysis> findByDoctorUserId(Long doctorId);

    List<MedicalAnalysis> findByStatus(AnalysisStatus status);
}
