package com.medicareplus.medical.medication;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicationServiceImpl implements MedicationService {

    private final MedicationRepository medicationRepository;

    @Override
    @CacheEvict(value = "medications", allEntries = true)
    @Transactional
    public MedicationResponse createMedication(MedicationRequest request) {
        log.info("Creating medication with name: {}", request.getName());

        Medication medication = new Medication();
        applyChanges(medication, request);

        MedicationResponse response = mapToResponse(medicationRepository.save(medication));
        log.info("Medication created successfully with id: {}", response.getId());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public MedicationResponse getMedicationById(Long id) {
        log.debug("Fetching medication with id: {}", id);
        return mapToResponse(findMedication(id));
    }

    @Override
    @Cacheable("medications")
    @Transactional(readOnly = true)
    public Page<MedicationResponse> getAllMedications(Pageable pageable) {
        log.debug("Fetching medications - page: {}, size: {}, sort: {}",
                pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());
        return medicationRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    @Override
    @CacheEvict(value = "medications", allEntries = true)
    @Transactional
    public MedicationResponse updateMedication(Long id, MedicationRequest request) {
        log.info("Updating medication with id: {}", id);
        Medication medication = findMedication(id);
        applyChanges(medication, request);

        MedicationResponse response = mapToResponse(medicationRepository.save(medication));
        log.info("Medication updated successfully with id: {}", id);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicationResponse> searchByName(String name) {
        log.debug("Searching medications with name containing: {}", name);
        return medicationRepository.findByNameContainingIgnoreCase(name)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @CacheEvict(value = "medications", allEntries = true)
    @Transactional
    public void deleteMedication(Long id) {
        log.info("Deleting medication with id: {}", id);
        findMedication(id);
        if (medicationRepository.hasPrescriptions(id)) {
            throw new BusinessException("Medication cannot be deleted because prescriptions are linked to it.");
        }
        medicationRepository.deleteById(id);
        log.info("Medication deleted successfully with id: {}", id);
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