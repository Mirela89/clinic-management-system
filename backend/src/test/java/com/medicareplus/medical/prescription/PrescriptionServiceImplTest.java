package com.medicareplus.medical.prescription;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.medical.consultation.Consultation;
import com.medicareplus.medical.consultation.ConsultationRepository;
import com.medicareplus.medical.medication.Medication;
import com.medicareplus.medical.medication.MedicationFrequency;
import com.medicareplus.medical.medication.MedicationRepository;
import com.medicareplus.support.TestDataFactory;
import com.medicareplus.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrescriptionServiceImplTest {

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private ConsultationRepository consultationRepository;

    @Mock
    private MedicationRepository medicationRepository;

    @InjectMocks
    private PrescriptionServiceImpl service;

    @Test
    void createPrescriptionShouldPersistAndMapMedicationItems() {
        Consultation consultation = TestDataFactory.consultation(
                10L,
                TestDataFactory.appointment(
                        11L,
                        TestDataFactory.patient(TestDataFactory.user(1L, "patient", UserRole.PATIENT)),
                        TestDataFactory.doctor(TestDataFactory.user(2L, "doctor", UserRole.DOCTOR))
                )
        );
        Medication medication = TestDataFactory.medication(3L, "Ibuprofen");
        PrescriptionMedicationRequest medicationRequest = new PrescriptionMedicationRequest();
        medicationRequest.setMedicationId(3L);
        medicationRequest.setQuantity(2);
        medicationRequest.setFrequency(MedicationFrequency.TWICE_DAILY);
        medicationRequest.setDurationDays(5);
        PrescriptionRequest request = new PrescriptionRequest();
        request.setConsultationId(10L);
        request.setIssueDate(LocalDate.of(2030, 1, 1));
        request.setExpiryDate(LocalDate.of(2030, 1, 7));
        request.setInstructions("After meals");
        request.setMedications(List.of(medicationRequest));

        when(consultationRepository.findById(10L)).thenReturn(Optional.of(consultation));
        when(medicationRepository.findById(3L)).thenReturn(Optional.of(medication));
        when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(invocation -> {
            Prescription prescription = invocation.getArgument(0);
            prescription.setId(20L);
            prescription.getPrescriptionMedications().forEach(item -> item.setPrescription(prescription));
            return prescription;
        });

        PrescriptionResponse response = service.createPrescription(request);

        assertEquals(20L, response.getId());
        assertEquals(1, response.getMedications().size());
        assertEquals("Ibuprofen", response.getMedications().getFirst().getMedicationName());
    }

    @Test
    void createPrescriptionShouldRejectInvalidDates() {
        PrescriptionRequest request = new PrescriptionRequest();
        request.setIssueDate(LocalDate.of(2030, 1, 10));
        request.setExpiryDate(LocalDate.of(2030, 1, 9));

        assertThrows(BusinessException.class, () -> service.createPrescription(request));
    }

    @Test
    void createPrescriptionShouldRejectDuplicateMedicationIds() {
        Consultation consultation = TestDataFactory.consultation(
                30L,
                TestDataFactory.appointment(
                        31L,
                        TestDataFactory.patient(TestDataFactory.user(4L, "patient4", UserRole.PATIENT)),
                        TestDataFactory.doctor(TestDataFactory.user(5L, "doctor5", UserRole.DOCTOR))
                )
        );
        Medication medication = TestDataFactory.medication(6L, "Paracetamol");
        PrescriptionMedicationRequest first = new PrescriptionMedicationRequest();
        first.setMedicationId(6L);
        first.setQuantity(1);
        PrescriptionMedicationRequest second = new PrescriptionMedicationRequest();
        second.setMedicationId(6L);
        second.setQuantity(2);
        PrescriptionRequest request = new PrescriptionRequest();
        request.setConsultationId(30L);
        request.setIssueDate(LocalDate.of(2030, 1, 1));
        request.setExpiryDate(LocalDate.of(2030, 1, 2));
        request.setMedications(List.of(first, second));

        when(consultationRepository.findById(30L)).thenReturn(Optional.of(consultation));
        when(medicationRepository.findById(6L)).thenReturn(Optional.of(medication));

        assertThrows(BusinessException.class, () -> service.createPrescription(request));
    }

    @Test
    void deletePrescriptionShouldRejectLinkedMedicationItems() {
        Prescription prescription = TestDataFactory.prescription(
                40L,
                TestDataFactory.consultation(
                        41L,
                        TestDataFactory.appointment(
                                42L,
                                TestDataFactory.patient(TestDataFactory.user(7L, "patient7", UserRole.PATIENT)),
                                TestDataFactory.doctor(TestDataFactory.user(8L, "doctor8", UserRole.DOCTOR))
                        )
                )
        );
        when(prescriptionRepository.findById(40L)).thenReturn(Optional.of(prescription));
        when(prescriptionRepository.hasMedications(40L)).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.deletePrescription(40L));
    }
}
