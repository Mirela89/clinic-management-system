package com.medicareplus.medical.medication;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MedicationService {

    MedicationResponse createMedication(MedicationRequest request);

    MedicationResponse getMedicationById(Long id);

    Page<MedicationResponse> getAllMedications(Pageable pageable);

    MedicationResponse updateMedication(Long id, MedicationRequest request);

    List<MedicationResponse> searchByName(String name);

    void deleteMedication(Long id);
}
