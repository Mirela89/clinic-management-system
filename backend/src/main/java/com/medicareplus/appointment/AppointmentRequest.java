package com.medicareplus.appointment;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.FutureOrPresent;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class AppointmentRequest {

    @NotNull(message = "Appointment date is required.")
    @FutureOrPresent(message = "Appointment date must be today or later.")
    private LocalDate appointmentDate;

    @NotNull(message = "Duration is required.")
    @Min(value = 1, message = "Duration must be at least 1 minute.")
    @Max(value = 180, message = "Duration must be at most 180 minutes.")
    private Integer durationMinutes;

    @NotNull(message = "Appointment status is required.")
    private AppointmentStatus status;

    private String notes;

    @NotNull(message = "Patient ID is required.")
    private Long patientId;

    @NotNull(message = "Doctor ID is required.")
    private Long doctorId;
}
