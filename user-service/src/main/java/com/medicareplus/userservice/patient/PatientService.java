package com.medicareplus.userservice.patient;

import com.medicareplus.userservice.patient.PatientRequest;
import com.medicareplus.userservice.patient.PatientResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PatientService {

    PatientResponse createPatient(PatientRequest request);

    PatientResponse getPatientById(Long userId);

    Page<PatientResponse> getAllPatients(Pageable pageable);

    PatientResponse updatePatient(Long userId, PatientRequest request);

    void deletePatient(Long userId);
}
