package com.medicareplus.patient;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.common.exception.ResourceNotFoundException;
import com.medicareplus.insurance.Insurance;
import com.medicareplus.insurance.InsuranceRepository;
import com.medicareplus.user.User;
import com.medicareplus.user.UserInfoResponse;
import com.medicareplus.user.UserRepository;
import com.medicareplus.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final InsuranceRepository insuranceRepository;

    @Override
    @Transactional
    public PatientResponse createPatient(PatientRequest request) {
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

        return mapToResponse(patientRepository.save(patient));
    }

    @Override
    public PatientResponse getPatientById(Long userId) {
        return mapToResponse(findPatient(userId));
    }

    @Override
    public List<PatientResponse> getAllPatients() {
        return patientRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PatientResponse updatePatient(Long userId, PatientRequest request) {
        Patient patient = findPatient(userId);

        if (!userId.equals(request.getUserId())) {
            throw new BusinessException("Patient user ID cannot be changed.");
        }

        if (!patient.getCnp().equals(request.getCnp()) && patientRepository.existsByCnp(request.getCnp())) {
            throw new BusinessException("CNP already in use.");
        }

        getPatientUser(request.getUserId());
        Insurance insurance = getInsurance(request.getInsuranceId());

        patient.setCnp(request.getCnp());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setAddress(request.getAddress());
        patient.setBloodType(request.getBloodType());
        patient.setInsurance(insurance);

        return mapToResponse(patientRepository.save(patient));
    }

    @Override
    @Transactional
    public void deletePatient(Long userId) {
        findPatient(userId);
        if (patientRepository.hasAppointments(userId)) {
            throw new BusinessException("Patient cannot be deleted because appointments are linked to this profile.");
        }
        patientRepository.deleteById(userId);
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

    private PatientUserInfo mapUser(User user) {
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
