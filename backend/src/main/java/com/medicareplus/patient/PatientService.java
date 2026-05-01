package com.medicareplus.patient;

import java.util.List;

public interface PatientService {

    PatientResponse createPatient(PatientRequest request);

    PatientResponse getPatientById(Long userId);

    List<PatientResponse> getAllPatients();

    PatientResponse updatePatient(Long userId, PatientRequest request);

    void deletePatient(Long userId);
}
