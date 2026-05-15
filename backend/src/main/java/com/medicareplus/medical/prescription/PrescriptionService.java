package com.medicareplus.medical.prescription;

import java.util.List;

public interface PrescriptionService {

    PrescriptionResponse createPrescription(PrescriptionRequest request);

    PrescriptionResponse getPrescriptionById(Long id);

    List<PrescriptionResponse> getAllPrescriptions();

    List<PrescriptionResponse> getPrescriptionsByPatientId(Long patientId);

    PrescriptionResponse updatePrescription(Long id, PrescriptionRequest request);

    void deletePrescription(Long id);
}
