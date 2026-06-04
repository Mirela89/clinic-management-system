package com.medicareplus.medicalservice.appointment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AppointmentService {

    AppointmentResponse createAppointment(AppointmentRequest request);

    AppointmentResponse getAppointmentById(Long id);

    Page<AppointmentResponse> getAllAppointments(Pageable pageable);

    List<AppointmentResponse> getAppointmentsByPatientId(Long patientId);

    AppointmentResponse updateAppointment(Long id, AppointmentRequest request);

    AppointmentResponse cancelAppointment(Long id);

    void deleteAppointment(Long id);
}
