package com.medicareplus.medical.prescription;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    @Query("SELECT COUNT(pm) > 0 FROM PrescriptionMedication pm WHERE pm.prescription.id = :id")
    boolean hasMedications(@Param("id") Long id);

    List<Prescription> findByConsultationAppointmentPatientUserIdOrderByIssueDateDesc(Long patientId);
}
