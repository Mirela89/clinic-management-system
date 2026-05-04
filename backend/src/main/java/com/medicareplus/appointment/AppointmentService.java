package com.medicareplus.appointment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AppointmentService {

    AppointmentResponse createAppointment(AppointmentRequest request);

    AppointmentResponse getAppointmentById(Long id);

    Page<AppointmentResponse> getAllAppointments(Pageable pageable);

    AppointmentResponse updateAppointment(Long id, AppointmentRequest request);

    void deleteAppointment(Long id);
}
