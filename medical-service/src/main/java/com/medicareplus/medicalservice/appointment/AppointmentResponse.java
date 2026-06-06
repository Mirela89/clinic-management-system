package com.medicareplus.medicalservice.appointment;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AppointmentResponse {

    private Long id;
    private LocalDateTime appointmentDate;
    private Integer durationMinutes;
    private String status;
    private String notes;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private Long consultationId;
}
