package com.medicareplus.medicalservice.doctor.schedule;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Getter
@Setter
public class DoctorScheduleRequest {

    @NotNull(message = "Doctor ID is required.")
    private Long doctorId;

    @NotNull(message = "Day of week is required.")
    private DayOfWeek dayOfWeek;

    @NotNull(message = "Start time is required.")
    private LocalTime startTime;

    @NotNull(message = "End time is required.")
    private LocalTime endTime;

    @NotNull(message = "Slot duration is required.")
    @Min(value = 5, message = "Slot duration must be at least 5 minutes.")
    @Max(value = 120, message = "Slot duration must be at most 120 minutes.")
    private Integer slotDurationMinutes;

    private Boolean isAvailable = true;
}