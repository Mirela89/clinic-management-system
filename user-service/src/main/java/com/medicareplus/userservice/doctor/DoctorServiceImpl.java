package com.medicareplus.userservice.doctor;

import com.medicareplus.userservice.common.exception.BusinessException;
import com.medicareplus.userservice.common.exception.ResourceNotFoundException;
import com.medicareplus.userservice.department.Department;
import com.medicareplus.userservice.department.DepartmentRepository;
import com.medicareplus.userservice.doctor.Doctor;
import com.medicareplus.userservice.doctor.DoctorRepository;
import com.medicareplus.userservice.user.User;
import com.medicareplus.userservice.user.UserRepository;
import com.medicareplus.userservice.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    @CacheEvict(value = "doctors", allEntries = true)
    @Transactional
    public DoctorResponse createDoctor(DoctorRequest request) {
        log.info("Creating doctor profile for userId: {}", request.getUserId());

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

        DoctorResponse response = mapToResponse(doctorRepository.save(doctor));
        log.info("Doctor profile created successfully for userId: {}", request.getUserId());
        return response;
    }

    @Override
    public DoctorResponse getDoctorById(Long userId) {
        log.debug("Fetching doctor with userId: {}", userId);
        return mapToResponse(findDoctor(userId));
    }

    @Override
    @Cacheable("doctors")
    public List<DoctorResponse> getAllDoctors() {
        log.debug("Fetching all doctors");
        return doctorRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @CacheEvict(value = "doctors", allEntries = true)
    @Transactional
    public DoctorResponse updateDoctor(Long userId, DoctorRequest request) {
        log.info("Updating doctor profile for userId: {}", userId);
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

        DoctorResponse response = mapToResponse(doctorRepository.save(doctor));
        log.info("Doctor profile updated successfully for userId: {}", userId);
        return response;
    }

    @Override
    @CacheEvict(value = "doctors", allEntries = true)
    @Transactional
    public void deleteDoctor(Long userId) {
        log.info("Deleting doctor profile for userId: {}", userId);
        findDoctor(userId);
//        if (doctorRepository.hasAppointments(userId)) {
//            throw new BusinessException("Doctor cannot be deleted because appointments are linked to this profile.");
//        }
//        if (doctorRepository.hasSchedules(userId)) {
//            throw new BusinessException("Doctor cannot be deleted because schedules are linked to this profile.");
//        }
        doctorRepository.deleteById(userId);
        log.info("Doctor profile deleted successfully for userId: {}", userId);
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