package com.medicareplus.doctor;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.common.exception.ResourceNotFoundException;
import com.medicareplus.department.Department;
import com.medicareplus.department.DepartmentRepository;
import com.medicareplus.user.User;
import com.medicareplus.user.UserRepository;
import com.medicareplus.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional
    public DoctorResponse createDoctor(DoctorRequest request) {
        if (doctorRepository.existsById(request.getUserId())) {
            throw new BusinessException("Doctor profile already exists for this user.");
        }
        validateLicenseNumberAvailability(request.getLicenseNumber(), null);

        User user = getDoctorUser(request.getUserId());
        Department department = getDepartment(request.getDepartmentId());

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setSpecialization(request.getSpecialization());
        doctor.setLicenseNumber(request.getLicenseNumber());
        doctor.setDepartment(department);

        return mapToResponse(doctorRepository.save(doctor));
    }

    @Override
    public DoctorResponse getDoctorById(Long userId) {
        return mapToResponse(findDoctor(userId));
    }

    @Override
    public List<DoctorResponse> getAllDoctors() {
        return doctorRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DoctorResponse updateDoctor(Long userId, DoctorRequest request) {
        Doctor doctor = findDoctor(userId);

        if (!userId.equals(request.getUserId())) {
            throw new BusinessException("Doctor user ID cannot be changed.");
        }

        getDoctorUser(request.getUserId());
        validateLicenseNumberAvailability(request.getLicenseNumber(), doctor.getLicenseNumber());
        Department department = getDepartment(request.getDepartmentId());

        doctor.setSpecialization(request.getSpecialization());
        doctor.setLicenseNumber(request.getLicenseNumber());
        doctor.setDepartment(department);

        return mapToResponse(doctorRepository.save(doctor));
    }

    @Override
    @Transactional
    public void deleteDoctor(Long userId) {
        findDoctor(userId);
        if (doctorRepository.hasAppointments(userId)) {
            throw new BusinessException("Doctor cannot be deleted because appointments are linked to this profile.");
        }
        if (doctorRepository.hasSchedules(userId)) {
            throw new BusinessException("Doctor cannot be deleted because schedules are linked to this profile.");
        }
        doctorRepository.deleteById(userId);
    }

    private Doctor findDoctor(Long userId) {
        return doctorRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", userId));
    }

    private User getDoctorUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (user.getRole() != UserRole.DOCTOR) {
            throw new BusinessException("User must have DOCTOR role.");
        }
        return user;
    }

    private Department getDepartment(Long departmentId) {
        if (departmentId == null) {
            return null;
        }
        return departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", departmentId));
    }

    private void validateLicenseNumberAvailability(String requestedLicenseNumber, String currentLicenseNumber) {
        if (requestedLicenseNumber == null || requestedLicenseNumber.isBlank()) {
            return;
        }
        if (!requestedLicenseNumber.equals(currentLicenseNumber) &&
                doctorRepository.existsByLicenseNumber(requestedLicenseNumber)) {
            throw new BusinessException("License number already in use.");
        }
    }

    private DoctorResponse mapToResponse(Doctor doctor) {
        Department department = doctor.getDepartment();
        return new DoctorResponse(
                doctor.getUserId(),
                mapUser(doctor.getUser()),
                doctor.getSpecialization(),
                doctor.getLicenseNumber(),
                department != null ? department.getId() : null,
                department != null ? department.getName() : null
        );
    }

    private DoctorUserInfo mapUser(User user) {
        return new DoctorUserInfo(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getRole().name()
        );
    }
}
