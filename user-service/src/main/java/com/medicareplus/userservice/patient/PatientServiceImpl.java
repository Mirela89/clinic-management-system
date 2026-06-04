package com.medicareplus.userservice.patient;

import com.medicareplus.userservice.common.exception.BusinessException;
import com.medicareplus.userservice.common.exception.ResourceNotFoundException;
import com.medicareplus.userservice.insurance.Insurance;
import com.medicareplus.userservice.insurance.InsuranceRepository;
import com.medicareplus.userservice.patient.*;
import com.medicareplus.userservice.user.User;
import com.medicareplus.userservice.user.UserRepository;
import com.medicareplus.userservice.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final InsuranceRepository insuranceRepository;

    @Override
    @Transactional
    public PatientResponse createPatient(PatientRequest request) {
        log.info("Creating patient profile for userId: {}", request.getUserId());

        if (patientRepository.existsById(request.getUserId())) {
            throw new BusinessException("Patient profile already exists for this user.");
        }
        if (patientRepository.existsByCnp(request.getCnp())) {
            throw new BusinessException("CNP already in use.");
        }

        User user = getPatientUser(request.getUserId());
        Insurance insurance = getInsurance(request.getInsuranceId());

        Patient patient = new Patient();
        patient.setUser(user);
        patient.setCnp(request.getCnp());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setAddress(request.getAddress());
        patient.setBloodType(request.getBloodType());
        patient.setInsurance(insurance);

        PatientResponse response = mapToResponse(patientRepository.save(patient));
        log.info("Patient profile created successfully for userId: {}", request.getUserId());
        return response;
    }

    @Override
    public PatientResponse getPatientById(Long userId) {
        log.debug("Fetching patient with userId: {}", userId);
        return mapToResponse(findPatient(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PatientResponse> getAllPatients(Pageable pageable) {
        log.debug("Fetching patients - page: {}, size: {}, sort: {}",
                pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());
        return patientRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public PatientResponse updatePatient(Long userId, PatientRequest request) {
        log.info("Updating patient profile for userId: {}", userId);
        Patient patient = findPatient(userId);

        if (!userId.equals(request.getUserId())) {
            throw new BusinessException("Patient user ID cannot be changed.");
        }
        if (!patient.getCnp().equals(request.getCnp()) &&
                patientRepository.existsByCnp(request.getCnp())) {
            throw new BusinessException("CNP already in use.");
        }

        getPatientUser(request.getUserId());
        Insurance insurance = getInsurance(request.getInsuranceId());

        patient.setCnp(request.getCnp());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setAddress(request.getAddress());
        patient.setBloodType(request.getBloodType());
        patient.setInsurance(insurance);

        PatientResponse response = mapToResponse(patientRepository.save(patient));
        log.info("Patient profile updated successfully for userId: {}", userId);
        return response;
    }

    @Override
    @Transactional
    public void deletePatient(Long userId) {
        log.info("Deleting patient profile for userId: {}", userId);
        findPatient(userId);
//        if (patientRepository.hasAppointments(userId)) {
//            throw new BusinessException("Patient cannot be deleted because appointments are linked to this profile.");
//        }
        patientRepository.deleteById(userId);
        log.info("Patient profile deleted successfully for userId: {}", userId);
    }

    private Patient findPatient(Long userId) {
        return patientRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", userId));
    }

    private User getPatientUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (user.getRole() != UserRole.PATIENT) {
            throw new BusinessException("User must have PATIENT role.");
        }
        return user;
    }

    private Insurance getInsurance(Long insuranceId) {
        if (insuranceId == null) {
            return null;
        }
        return insuranceRepository.findById(insuranceId)
                .orElseThrow(() -> new ResourceNotFoundException("Insurance", insuranceId));
    }

    private PatientResponse mapToResponse(Patient patient) {
        Insurance insurance = patient.getInsurance();
        return new PatientResponse(
                patient.getUserId(),
                mapUser(patient.getUser()),
                patient.getCnp(),
                patient.getDateOfBirth(),
                patient.getAddress(),
                patient.getBloodType() != null ? patient.getBloodType().name() : null,
                insurance != null ? insurance.getId() : null,
                insurance != null ? insurance.getProviderName() : null
        );
    }

    private com.medicareplus.userservice.patient.PatientUserInfo mapUser(User user) {
        return new PatientUserInfo(
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