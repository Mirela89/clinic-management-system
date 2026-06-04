package com.medicareplus.medicalservice.medical.consultation;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ConsultationResponse {

    private Long id;
    private String diagnosis;
    private String notes;
    private LocalDateTime consultationDate;
    private Long appointmentId;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private Integer prescriptionCount;
    private Integer analysisCount;
}
