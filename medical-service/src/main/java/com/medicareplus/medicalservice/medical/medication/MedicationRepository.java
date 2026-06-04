package com.medicareplus.medicalservice.medical.medication;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicationRepository extends JpaRepository<Medication, Long> {

    List<Medication> findByNameContainingIgnoreCase(String name);

    @Query("SELECT COUNT(pm) > 0 FROM PrescriptionMedication pm WHERE pm.medication.id = :id")
    boolean hasPrescriptions(@Param("id") Long id);
}
