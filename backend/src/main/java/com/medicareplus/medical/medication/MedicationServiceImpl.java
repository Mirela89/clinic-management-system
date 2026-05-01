package com.medicareplus.medical.medication;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicationServiceImpl implements MedicationService {

    private final MedicationRepository medicationRepository;

    @Override
    @Transactional
    public MedicationResponse createMedication(MedicationRequest request) {
        Medication medication = new Medication();
        applyChanges(medication, request);

        return mapToResponse(medicationRepository.save(medication));
    }

    @Override
    public MedicationResponse getMedicationById(Long id) {
        return mapToResponse(findMedication(id));
    }

    @Override
    public List<MedicationResponse> getAllMedications() {
        return medicationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MedicationResponse updateMedication(Long id, MedicationRequest request) {
        Medication medication = findMedication(id);
        applyChanges(medication, request);

        return mapToResponse(medicationRepository.save(medication));
    }

    @Override
    @Transactional
    public void deleteMedication(Long id) {
        Medication medication = findMedication(id);
        if (medication.getPrescriptionMedications() != null && !medication.getPrescriptionMedications().isEmpty()) {
            throw new BusinessException("Medication cannot be deleted because prescriptions are linked to it.");
        }
        medicationRepository.delete(medication);
    }

    private Medication findMedication(Long id) {
        return medicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medication", id));
    }

    private void applyChanges(Medication medication, MedicationRequest request) {
        medication.setName(request.getName());
        medication.setActiveSubstance(request.getActiveSubstance());
        medication.setDosage(request.getDosage());
        medication.setManufacturer(request.getManufacturer());
    }

    private MedicationResponse mapToResponse(Medication medication) {
        return new MedicationResponse(
                medication.getId(),
                medication.getName(),
                medication.getActiveSubstance(),
                medication.getDosage(),
                medication.getManufacturer()
        );
    }
}
