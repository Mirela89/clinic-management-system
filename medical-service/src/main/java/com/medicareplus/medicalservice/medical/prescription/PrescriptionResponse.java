package com.medicareplus.medicalservice.medical.prescription;

import com.medicareplus.medicalservice.medical.prescription.PrescriptionMedicationResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PrescriptionResponse {

    private Long id;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String instructions;
    private Long consultationId;
    private Long appointmentId;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private List<PrescriptionMedicationResponse> medications;
}
