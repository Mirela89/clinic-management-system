package com.medicareplus.department;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.doctor.Doctor;
import com.medicareplus.support.TestDataFactory;
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
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceImplTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @InjectMocks
    private DepartmentServiceImpl service;

    @Test
    void createDepartmentShouldPersistAndMapResponse() {
        DepartmentRequest request = new DepartmentRequest();
        request.setName("Cardiology");
        request.setDescription("Heart care");
        request.setFloor(3);

        when(departmentRepository.save(any(Department.class))).thenAnswer(invocation -> {
            Department department = invocation.getArgument(0);
            department.setId(1L);
            return department;
        });

        DepartmentResponse response = service.createDepartment(request);

        assertEquals(1L, response.getId());
        assertEquals("Cardiology", response.getName());
        assertEquals(0, response.getDoctorCount());
    }

    @Test
    void createDepartmentShouldRejectDuplicateName() {
        DepartmentRequest request = new DepartmentRequest();
        request.setName("Radiology");

        when(departmentRepository.existsByNameIgnoreCase("Radiology")).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.createDepartment(request));
        verify(departmentRepository, never()).save(any());
    }

    @Test
    void getAllDepartmentsShouldMapDoctorCount() {
        Department department = TestDataFactory.department(2L, "Dermatology");
        Doctor doctor = new Doctor();
        department.setDoctors(List.of(doctor));
        when(departmentRepository.findAll()).thenReturn(List.of(department));

        List<DepartmentResponse> responses = service.getAllDepartments();

        assertEquals(1, responses.size());
        assertEquals(1, responses.getFirst().getDoctorCount());
    }

    @Test
    void updateDepartmentShouldRejectDuplicateRenamedDepartment() {
        Department existing = TestDataFactory.department(4L, "Neurology");
        DepartmentRequest request = new DepartmentRequest();
        request.setName("Cardiology");

        when(departmentRepository.findById(4L)).thenReturn(Optional.of(existing));
        when(departmentRepository.existsByNameIgnoreCase("Cardiology")).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.updateDepartment(4L, request));
    }

    @Test
    void deleteDepartmentShouldRejectLinkedDoctors() {
        Department existing = TestDataFactory.department(5L, "Pediatrics");
        when(departmentRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(departmentRepository.hasDoctors(5L)).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.deleteDepartment(5L));
        verify(departmentRepository, never()).deleteById(any());
    }

    @Test
    void deleteDepartmentShouldDeleteWhenUnlinked() {
        Department existing = TestDataFactory.department(6L, "ENT");
        when(departmentRepository.findById(6L)).thenReturn(Optional.of(existing));
        when(departmentRepository.hasDoctors(6L)).thenReturn(false);
        doNothing().when(departmentRepository).deleteById(6L);

        service.deleteDepartment(6L);

        verify(departmentRepository).deleteById(6L);
    }
}
