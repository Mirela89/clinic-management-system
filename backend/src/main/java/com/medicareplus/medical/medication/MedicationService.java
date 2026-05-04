package com.medicareplus.medical.medication;

import java.util.List;

public interface MedicationService {

    MedicationResponse createMedication(MedicationRequest request);

    MedicationResponse getMedicationById(Long id);

    List<MedicationResponse> getAllMedications();

    MedicationResponse updateMedication(Long id, MedicationRequest request);

    List<MedicationResponse> searchByName(String name);

    void deleteMedication(Long id);
}
