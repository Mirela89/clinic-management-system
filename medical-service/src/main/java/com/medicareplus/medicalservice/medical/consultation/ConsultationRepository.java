package com.medicareplus.medicalservice.medical.consultation;

import com.medicareplus.medicalservice.medical.consultation.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    // In loc de findByAppointmentPatientUserIdOrderByConsultationDateDesc
    List<Consultation> findByPatientIdOrderByConsultationDateDesc(Long patientId);

    boolean existsByAppointment_Id(Long appointmentId);

    @Query("SELECT COUNT(p) > 0 FROM Prescription p WHERE p.consultation.id = :consultationId")
    boolean hasPrescriptions(@Param("consultationId") Long consultationId);

    @Query("SELECT COUNT(a) > 0 FROM MedicalAnalysis a WHERE a.consultation.id = :consultationId")
    boolean hasAnalyses(@Param("consultationId") Long consultationId);
}
