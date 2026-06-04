package com.medicareplus.appointment;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.doctor.Doctor;
import com.medicareplus.doctor.DoctorRepository;
import com.medicareplus.patient.Patient;
import com.medicareplus.patient.PatientRepository;
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
class AppointmentServiceImplTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private AppointmentServiceImpl service;

    @Test
    void createAppointmentShouldPersistAndMapResponse() {
        User patientUser = TestDataFactory.user(1L, "patient", UserRole.PATIENT);
        User doctorUser = TestDataFactory.user(2L, "doctor", UserRole.DOCTOR);
        Patient patient = TestDataFactory.patient(patientUser);
        Doctor doctor = TestDataFactory.doctor(doctorUser);
        AppointmentRequest request = new AppointmentRequest();
        request.setAppointmentDate(LocalDateTime.of(2030, 1, 1, 9, 0));
        request.setDurationMinutes(30);
        request.setStatus(AppointmentStatus.SCHEDULED);
        request.setNotes("Checkup");
        request.setPatientId(1L);
        request.setDoctorId(2L);

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(2L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> {
            Appointment appointment = invocation.getArgument(0);
            appointment.setId(10L);
            return appointment;
        });

        AppointmentResponse response = service.createAppointment(request);

        assertEquals(10L, response.getId());
        assertEquals(1L, response.getPatientId());
        assertEquals("First1 Last1", response.getPatientName());
        assertEquals("First2 Last2", response.getDoctorName());
    }

    @Test
    void createAppointmentShouldRejectNonPatientUser() {
        User admin = TestDataFactory.user(3L, "admin", UserRole.ADMIN);
        User doctorUser = TestDataFactory.user(4L, "doctor4", UserRole.DOCTOR);
        Patient patient = TestDataFactory.patient(admin);
        Doctor doctor = TestDataFactory.doctor(doctorUser);
        AppointmentRequest request = new AppointmentRequest();
        request.setPatientId(3L);
        request.setDoctorId(4L);
        request.setAppointmentDate(LocalDateTime.of(2030, 1, 1, 9, 0));
        request.setDurationMinutes(20);
        request.setStatus(AppointmentStatus.SCHEDULED);

        when(patientRepository.findById(3L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(4L)).thenReturn(Optional.of(doctor));

        assertThrows(BusinessException.class, () -> service.createAppointment(request));
    }

    @Test
    void getAllAppointmentsShouldMapConsultationId() {
        User patientUser = TestDataFactory.user(5L, "patient5", UserRole.PATIENT);
        User doctorUser = TestDataFactory.user(6L, "doctor6", UserRole.DOCTOR);
        Patient patient = TestDataFactory.patient(patientUser);
        Doctor doctor = TestDataFactory.doctor(doctorUser);
        Appointment appointment = TestDataFactory.appointment(11L, patient, doctor);
        appointment.setConsultation(TestDataFactory.consultation(99L, appointment));
        Page<Appointment> page = new PageImpl<>(List.of(appointment));
        when(appointmentRepository.findAll(PageRequest.of(0, 10))).thenReturn(page);

        Page<AppointmentResponse> responses = service.getAllAppointments(PageRequest.of(0, 10));

        assertEquals(1, responses.getTotalElements());
        assertEquals(99L, responses.getContent().getFirst().getConsultationId());
    }

    @Test
    void deleteAppointmentShouldRejectLinkedConsultation() {
        User patientUser = TestDataFactory.user(7L, "patient7", UserRole.PATIENT);
        User doctorUser = TestDataFactory.user(8L, "doctor8", UserRole.DOCTOR);
        Appointment appointment = TestDataFactory.appointment(12L, TestDataFactory.patient(patientUser),
                TestDataFactory.doctor(doctorUser));
        when(appointmentRepository.findById(12L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.hasConsultation(12L)).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.deleteAppointment(12L));
    }
}
