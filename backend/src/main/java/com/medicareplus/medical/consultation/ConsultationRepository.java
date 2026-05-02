package com.medicareplus.medical.consultation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    boolean existsByAppointment_Id(Long appointmentId);

    @Query("SELECT COUNT(p) > 0 FROM Prescription p WHERE p.consultation.id = :id")
    boolean hasPrescriptions(@Param("id") Long id);

    @Query("SELECT COUNT(a) > 0 FROM MedicalAnalysis a WHERE a.consultation.id = :id")
    boolean hasAnalyses(@Param("id") Long id);
}
