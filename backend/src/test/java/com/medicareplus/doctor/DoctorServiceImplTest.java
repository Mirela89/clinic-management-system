package com.medicareplus.doctor;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.department.Department;
import com.medicareplus.department.DepartmentRepository;
import com.medicareplus.support.TestDataFactory;
import com.medicareplus.user.User;
import com.medicareplus.user.UserRepository;
import com.medicareplus.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorServiceImplTest {

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @InjectMocks
    private DoctorServiceImpl service;

    @Test
    void createDoctorShouldPersistAndMapResponse() {
        User user = TestDataFactory.user(1L, "doctor", UserRole.DOCTOR);
        Department department = TestDataFactory.department(2L, "Cardiology");
        DoctorRequest request = new DoctorRequest();
        request.setUserId(1L);
        request.setSpecialization("Cardiology");
        request.setLicenseNumber("DOC-1");
        request.setDepartmentId(2L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(departmentRepository.findById(2L)).thenReturn(Optional.of(department));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(invocation -> {
            Doctor doctor = invocation.getArgument(0);
            doctor.setUserId(user.getId());
            return doctor;
        });

        DoctorResponse response = service.createDoctor(request);

        assertEquals(1L, response.getUserId());
        assertEquals("doctor", response.getUser().getUsername());
        assertEquals("Cardiology", response.getDepartmentName());
    }

    @Test
    void createDoctorShouldRejectDuplicateLicenseNumber() {
        DoctorRequest request = new DoctorRequest();
        request.setUserId(4L);
        request.setLicenseNumber("TAKEN");

        when(doctorRepository.existsByLicenseNumber("TAKEN")).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.createDoctor(request));
    }

    @Test
    void getAllDoctorsShouldMapResponses() {
        User user = TestDataFactory.user(5L, "doc5", UserRole.DOCTOR);
        Doctor doctor = TestDataFactory.doctor(user);
        when(doctorRepository.findAll()).thenReturn(List.of(doctor));

        List<DoctorResponse> responses = service.getAllDoctors();

        assertEquals(1, responses.size());
        assertEquals("doc5", responses.getFirst().getUser().getUsername());
    }

    @Test
    void updateDoctorShouldRejectChangingUserId() {
        User user = TestDataFactory.user(6L, "doc6", UserRole.DOCTOR);
        Doctor doctor = TestDataFactory.doctor(user);
        DoctorRequest request = new DoctorRequest();
        request.setUserId(99L);

        when(doctorRepository.findById(6L)).thenReturn(Optional.of(doctor));

        assertThrows(BusinessException.class, () -> service.updateDoctor(6L, request));
    }

    @Test
    void deleteDoctorShouldRejectLinkedSchedules() {
        User user = TestDataFactory.user(7L, "doc7", UserRole.DOCTOR);
        Doctor doctor = TestDataFactory.doctor(user);
        when(doctorRepository.findById(7L)).thenReturn(Optional.of(doctor));
        when(doctorRepository.hasAppointments(7L)).thenReturn(false);
        when(doctorRepository.hasSchedules(7L)).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.deleteDoctor(7L));
        verify(doctorRepository).hasSchedules(7L);
    }
}
