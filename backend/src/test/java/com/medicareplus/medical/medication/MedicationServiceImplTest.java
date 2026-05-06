package com.medicareplus.medical.medication;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedicationServiceImplTest {

    @Mock
    private MedicationRepository medicationRepository;

    @InjectMocks
    private MedicationServiceImpl service;

    @Test
    void createMedicationShouldPersistAndMapResponse() {
        MedicationRequest request = new MedicationRequest();
        request.setName("Ibuprofen");
        request.setActiveSubstance("Ibuprofen");
        request.setDosage("400mg");
        request.setManufacturer("Pharma");

        when(medicationRepository.save(any(Medication.class))).thenAnswer(invocation -> {
            Medication medication = invocation.getArgument(0);
            medication.setId(1L);
            return medication;
        });

        MedicationResponse response = service.createMedication(request);

        assertEquals(1L, response.getId());
        assertEquals("Ibuprofen", response.getName());
    }

    @Test
    void getAllMedicationsShouldMapPageContent() {
        Medication medication = TestDataFactory.medication(2L, "Paracetamol");
        Page<Medication> page = new PageImpl<>(List.of(medication));
        when(medicationRepository.findAll(PageRequest.of(0, 10))).thenReturn(page);

        Page<MedicationResponse> responses = service.getAllMedications(PageRequest.of(0, 10));

        assertEquals(1, responses.getTotalElements());
        assertEquals("Paracetamol", responses.getContent().getFirst().getName());
    }

    @Test
    void searchByNameShouldReturnMappedResults() {
        Medication medication = TestDataFactory.medication(3L, "Amoxicillin");
        when(medicationRepository.findByNameContainingIgnoreCase("amox")).thenReturn(List.of(medication));

        List<MedicationResponse> responses = service.searchByName("amox");

        assertEquals(1, responses.size());
        assertEquals(3L, responses.getFirst().getId());
    }

    @Test
    void updateMedicationShouldPersistChanges() {
        Medication existing = TestDataFactory.medication(4L, "Old");
        MedicationRequest request = new MedicationRequest();
        request.setName("New");
        request.setActiveSubstance("New substance");
        request.setDosage("200mg");
        request.setManufacturer("Lab");

        when(medicationRepository.findById(4L)).thenReturn(Optional.of(existing));
        when(medicationRepository.save(existing)).thenReturn(existing);

        MedicationResponse response = service.updateMedication(4L, request);

        assertEquals("New", response.getName());
        assertEquals("New substance", response.getActiveSubstance());
    }

    @Test
    void deleteMedicationShouldRejectLinkedPrescriptions() {
        Medication existing = TestDataFactory.medication(5L, "Linked");
        when(medicationRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(medicationRepository.hasPrescriptions(5L)).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.deleteMedication(5L));
        verify(medicationRepository).hasPrescriptions(5L);
    }
}
