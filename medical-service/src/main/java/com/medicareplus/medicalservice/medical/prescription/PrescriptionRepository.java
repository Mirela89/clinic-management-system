package com.medicareplus.medicalservice.medical.prescription;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    // In loc de findByConsultationAppointmentPatientUserIdOrderByIssueDateDesc
    List<Prescription> findByConsultationPatientIdOrderByIssueDateDesc(Long patientId);

    @Query("SELECT COUNT(pm) > 0 FROM PrescriptionMedication pm WHERE pm.id.prescriptionId = :prescriptionId")
    boolean hasMedications(@Param("prescriptionId") Long prescriptionId);
}
