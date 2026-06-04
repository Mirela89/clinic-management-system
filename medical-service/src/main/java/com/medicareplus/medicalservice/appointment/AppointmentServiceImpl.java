package com.medicareplus.medicalservice.appointment;

import com.medicareplus.medicalservice.client.NotificationServiceClient;
import com.medicareplus.medicalservice.client.UserServiceClient;
import com.medicareplus.medicalservice.common.exception.BusinessException;
import com.medicareplus.medicalservice.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserServiceClient userServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    @Override
    @Transactional
    public AppointmentResponse createAppointment(AppointmentRequest request) {
        log.info("Creating appointment for patientId: {} with doctorId: {}",
                request.getPatientId(), request.getDoctorId());

        UserServiceClient.PatientDto patient = userServiceClient.getPatient(request.getPatientId()).getData();
        UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(request.getDoctorId()).getData();

        Appointment appointment = new Appointment();
        appointment.setPatientId(request.getPatientId());
        appointment.setDoctorId(request.getDoctorId());
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setDurationMinutes(request.getDurationMinutes());
        appointment.setStatus(request.getStatus());
        appointment.setNotes(request.getNotes());

        Appointment saved = appointmentRepository.save(appointment);
        log.info("Appointment created successfully with id: {}", saved.getId());

        try {
            notificationServiceClient.sendNotification(new NotificationServiceClient.NotificationRequest(
                    request.getPatientId(),
                    "APPOINTMENT_CONFIRMATION",
                    "SENT",
                    "Your appointment with Dr. " + doctor.getFirstName() + " " + doctor.getLastName() +
                            " on " + saved.getAppointmentDate().toLocalDate() + " has been confirmed."
            ));
            notificationServiceClient.sendNotification(new NotificationServiceClient.NotificationRequest(
                    request.getDoctorId(),
                    "APPOINTMENT_CONFIRMATION",
                    "SENT",
                    "New appointment booked by " + patient.getFirstName() + " " + patient.getLastName() +
                            " on " + saved.getAppointmentDate().toLocalDate() + "."
            ));
        } catch (Exception e) {
            log.warn("Failed to send notifications for appointment {}: {}", saved.getId(), e.getMessage());
        }

        return mapToResponse(saved, patient, doctor);
    }

    @Override
    public AppointmentResponse getAppointmentById(Long id) {
        Appointment appointment = findAppointment(id);
        UserServiceClient.PatientDto patient = userServiceClient.getPatient(appointment.getPatientId()).getData();
        UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(appointment.getDoctorId()).getData();
        return mapToResponse(appointment, patient, doctor);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getAllAppointments(Pageable pageable) {
        return appointmentRepository.findAll(pageable)
                .map(appointment -> {
                    UserServiceClient.PatientDto patient = userServiceClient.getPatient(appointment.getPatientId()).getData();
                    UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(appointment.getDoctorId()).getData();
                    return mapToResponse(appointment, patient, doctor);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsByPatientId(Long patientId) {
        UserServiceClient.PatientDto patient = userServiceClient.getPatient(patientId).getData();
        return appointmentRepository.findByPatientIdOrderByAppointmentDateDesc(patientId)
                .stream()
                .map(appointment -> {
                    UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(appointment.getDoctorId()).getData();
                    return mapToResponse(appointment, patient, doctor);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppointmentResponse updateAppointment(Long id, AppointmentRequest request) {
        Appointment appointment = findAppointment(id);
        UserServiceClient.PatientDto patient = userServiceClient.getPatient(request.getPatientId()).getData();
        UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(request.getDoctorId()).getData();

        appointment.setPatientId(request.getPatientId());
        appointment.setDoctorId(request.getDoctorId());
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setDurationMinutes(request.getDurationMinutes());
        appointment.setStatus(request.getStatus());
        appointment.setNotes(request.getNotes());

        Appointment saved = appointmentRepository.save(appointment);
        log.info("Appointment updated successfully with id: {}", id);
        return mapToResponse(saved, patient, doctor);
    }

    @Override
    @Transactional
    public AppointmentResponse cancelAppointment(Long id) {
        Appointment appointment = findAppointment(id);

        if (appointment.getStatus() != AppointmentStatus.SCHEDULED) {
            throw new BusinessException("Only scheduled appointments can be cancelled.");
        }

        UserServiceClient.PatientDto patient = userServiceClient.getPatient(appointment.getPatientId()).getData();
        UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(appointment.getDoctorId()).getData();

        appointment.setStatus(AppointmentStatus.CANCELLED);
        Appointment saved = appointmentRepository.save(appointment);

        try {
            notificationServiceClient.sendNotification(new NotificationServiceClient.NotificationRequest(
                    appointment.getPatientId(),
                    "APPOINTMENT_CANCELLATION",
                    "SENT",
                    "Your appointment with Dr. " + doctor.getFirstName() + " " + doctor.getLastName() +
                            " on " + appointment.getAppointmentDate().toLocalDate() + " has been cancelled."
            ));
            notificationServiceClient.sendNotification(new NotificationServiceClient.NotificationRequest(
                    appointment.getDoctorId(),
                    "APPOINTMENT_CANCELLATION",
                    "SENT",
                    "Appointment with " + patient.getFirstName() + " " + patient.getLastName() +
                            " on " + appointment.getAppointmentDate().toLocalDate() + " has been cancelled."
            ));
        } catch (Exception e) {
            log.warn("Failed to send cancellation notifications for appointment {}: {}", id, e.getMessage());
        }

        return mapToResponse(saved, patient, doctor);
    }

    @Override
    @Transactional
    public void deleteAppointment(Long id) {
        findAppointment(id);
        if (appointmentRepository.hasConsultation(id)) {
            throw new BusinessException("Appointment cannot be deleted because a consultation is linked to it.");
        }
        appointmentRepository.deleteById(id);
        log.info("Appointment deleted successfully with id: {}", id);
    }

    private Appointment findAppointment(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
    }

    private AppointmentResponse mapToResponse(Appointment appointment,
                                              UserServiceClient.PatientDto patient,
                                              UserServiceClient.DoctorDto doctor) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getAppointmentDate(),
                appointment.getDurationMinutes(),
                appointment.getStatus().name(),
                appointment.getNotes(),
                appointment.getPatientId(),
                patient.getFirstName() + " " + patient.getLastName(),
                appointment.getDoctorId(),
                doctor.getFirstName() + " " + doctor.getLastName(),
                appointment.getConsultation() != null ? appointment.getConsultation().getId() : null
        );
    }
}