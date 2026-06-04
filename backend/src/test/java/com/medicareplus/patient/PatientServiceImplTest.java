package com.medicareplus.patient;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.insurance.Insurance;
import com.medicareplus.insurance.InsuranceRepository;
import com.medicareplus.support.TestDataFactory;
import com.medicareplus.user.User;
import com.medicareplus.user.UserRepository;
import com.medicareplus.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientServiceImplTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InsuranceRepository insuranceRepository;

    @InjectMocks
    private PatientServiceImpl service;

    @Test
    void createPatientShouldPersistAndMapResponse() {
        User user = TestDataFactory.user(1L, "patient", UserRole.PATIENT);
        Insurance insurance = TestDataFactory.insurance(2L, "Provider", "POL-1");
        PatientRequest request = new PatientRequest();
        request.setUserId(1L);
        request.setCnp("1234567890123");
        request.setDateOfBirth(LocalDate.of(1995, 1, 1));
        request.setAddress("Street 1");
        request.setBloodType(BloodType.B_NEGATIVE);
        request.setInsuranceId(2L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(insuranceRepository.findById(2L)).thenReturn(Optional.of(insurance));
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> {
            Patient patient = invocation.getArgument(0);
            patient.setUserId(user.getId());
            return patient;
        });

        PatientResponse response = service.createPatient(request);

        assertEquals(1L, response.getUserId());
        assertEquals("patient", response.getUser().getUsername());
        assertEquals("Provider", response.getInsuranceProviderName());
    }

    @Test
    void createPatientShouldRejectNonPatientUser() {
        User user = TestDataFactory.user(3L, "admin", UserRole.ADMIN);
        PatientRequest request = new PatientRequest();
        request.setUserId(3L);
        request.setCnp("1234567890123");

        when(userRepository.findById(3L)).thenReturn(Optional.of(user));

        assertThrows(BusinessException.class, () -> service.createPatient(request));
    }

    @Test
    void getAllPatientsShouldMapPagedResponses() {
        User user = TestDataFactory.user(4L, "page-patient", UserRole.PATIENT);
        Patient patient = TestDataFactory.patient(user);
        Page<Patient> page = new PageImpl<>(java.util.List.of(patient));
        when(patientRepository.findAll(PageRequest.of(0, 5))).thenReturn(page);

        Page<PatientResponse> responses = service.getAllPatients(PageRequest.of(0, 5));

        assertEquals(1, responses.getTotalElements());
        assertEquals("page-patient", responses.getContent().getFirst().getUser().getUsername());
    }

    @Test
    void updatePatientShouldRejectChangingUserId() {
        User user = TestDataFactory.user(5L, "patient-5", UserRole.PATIENT);
        Patient patient = TestDataFactory.patient(user);
        PatientRequest request = new PatientRequest();
        request.setUserId(99L);
        request.setCnp("1234567890123");

        when(patientRepository.findById(5L)).thenReturn(Optional.of(patient));

        assertThrows(BusinessException.class, () -> service.updatePatient(5L, request));
    }

    @Test
    void deletePatientShouldRejectLinkedAppointments() {
        User user = TestDataFactory.user(6L, "patient-6", UserRole.PATIENT);
        Patient patient = TestDataFactory.patient(user);
        when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
        when(patientRepository.hasAppointments(6L)).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.deletePatient(6L));
        verify(patientRepository).hasAppointments(6L);
    }
}
