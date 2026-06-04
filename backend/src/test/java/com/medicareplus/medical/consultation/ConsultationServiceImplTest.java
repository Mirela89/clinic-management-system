package com.medicareplus.medical.consultation;

import com.medicareplus.appointment.Appointment;
import com.medicareplus.appointment.AppointmentRepository;
import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.doctor.Doctor;
import com.medicareplus.patient.Patient;
import com.medicareplus.support.TestDataFactory;
import com.medicareplus.user.User;
import com.medicareplus.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConsultationServiceImplTest {

    @Mock
    private ConsultationRepository consultationRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private ConsultationServiceImpl service;

    @Test
    void createConsultationShouldPersistAndMapResponse() {
        User patientUser = TestDataFactory.user(1L, "patient", UserRole.PATIENT);
        User doctorUser = TestDataFactory.user(2L, "doctor", UserRole.DOCTOR);
        Patient patient = TestDataFactory.patient(patientUser);
        Doctor doctor = TestDataFactory.doctor(doctorUser);
        Appointment appointment = TestDataFactory.appointment(10L, patient, doctor);
        ConsultationRequest request = new ConsultationRequest();
        request.setDiagnosis("Flu");
        request.setNotes("Rest");
        request.setConsultationDate(LocalDateTime.of(2030, 1, 1, 11, 0));
        request.setAppointmentId(10L);

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(invocation -> {
            Consultation consultation = invocation.getArgument(0);
            consultation.setId(100L);
            return consultation;
        });

        ConsultationResponse response = service.createConsultation(request);

        assertEquals(100L, response.getId());
        assertEquals(10L, response.getAppointmentId());
        assertEquals("First1 Last1", response.getPatientName());
    }

    @Test
    void createConsultationShouldRejectAlreadyUsedAppointment() {
        ConsultationRequest request = new ConsultationRequest();
        request.setAppointmentId(11L);

        when(consultationRepository.existsByAppointment_Id(11L)).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.createConsultation(request));
    }

    @Test
    void getAllConsultationsShouldMapChildCounts() {
        User patientUser = TestDataFactory.user(3L, "patient3", UserRole.PATIENT);
        User doctorUser = TestDataFactory.user(4L, "doctor4", UserRole.DOCTOR);
        Consultation consultation = TestDataFactory.consultation(
                12L,
                TestDataFactory.appointment(13L, TestDataFactory.patient(patientUser), TestDataFactory.doctor(doctorUser))
        );
        consultation.setPrescriptions(List.of(new com.medicareplus.medical.prescription.Prescription()));
        consultation.setAnalyses(List.of(new com.medicareplus.medical.analysis.MedicalAnalysis()));
        Page<Consultation> page = new PageImpl<>(List.of(consultation));
        when(consultationRepository.findAll(PageRequest.of(0, 10))).thenReturn(page);

        Page<ConsultationResponse> responses = service.getAllConsultations(PageRequest.of(0, 10));

        assertEquals(1, responses.getTotalElements());
        assertEquals(1, responses.getContent().getFirst().getPrescriptionCount());
        assertEquals(1, responses.getContent().getFirst().getAnalysisCount());
    }

    @Test
    void deleteConsultationShouldRejectLinkedPrescriptions() {
        Consultation consultation = TestDataFactory.consultation(
                14L,
                TestDataFactory.appointment(
                        15L,
                        TestDataFactory.patient(TestDataFactory.user(5L, "patient5", UserRole.PATIENT)),
                        TestDataFactory.doctor(TestDataFactory.user(6L, "doctor6", UserRole.DOCTOR))
                )
        );
        when(consultationRepository.findById(14L)).thenReturn(Optional.of(consultation));
        when(consultationRepository.hasPrescriptions(14L)).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.deleteConsultation(14L));
    }
}
