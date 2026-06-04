package com.medicareplus.appointment;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.common.exception.ResourceNotFoundException;
import com.medicareplus.doctor.Doctor;
import com.medicareplus.doctor.DoctorRepository;
import com.medicareplus.notification.NotificationRequest;
import com.medicareplus.notification.NotificationService;
import com.medicareplus.notification.NotificationStatus;
import com.medicareplus.notification.NotificationType;
import com.medicareplus.patient.Patient;
import com.medicareplus.patient.PatientRepository;
import com.medicareplus.user.UserRole;
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
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public AppointmentResponse createAppointment(AppointmentRequest request) {
        log.info("Creating appointment for patientId: {} with doctorId: {}",
                request.getPatientId(), request.getDoctorId());

        Appointment appointment = new Appointment();
        applyChanges(appointment, request);

        AppointmentResponse response = mapToResponse(appointmentRepository.save(appointment));
        log.info("Appointment created successfully with id: {}", response.getId());

        // Notificare pacient
        notificationService.createNotification(new NotificationRequest() {{
            setUserId(appointment.getPatient().getUserId());
            setType(NotificationType.APPOINTMENT_CONFIRMATION);
            setStatus(NotificationStatus.SENT);
            setMessage("Your appointment with Dr. " +
                    appointment.getDoctor().getUser().getFirstName() + " " +
                    appointment.getDoctor().getUser().getLastName() +
                    " on " + appointment.getAppointmentDate().toLocalDate() +
                    " has been confirmed.");
        }});

        // Notificare doctor
        notificationService.createNotification(new NotificationRequest() {{
            setUserId(appointment.getDoctor().getUserId());
            setType(NotificationType.APPOINTMENT_CONFIRMATION);
            setStatus(NotificationStatus.SENT);
            setMessage("New appointment booked by " +
                    appointment.getPatient().getUser().getFirstName() + " " +
                    appointment.getPatient().getUser().getLastName() +
                    " on " + appointment.getAppointmentDate().toLocalDate() + ".");
        }});

        return response;
    }

    @Override
    public AppointmentResponse getAppointmentById(Long id) {
        log.debug("Fetching appointment with id: {}", id);
        return mapToResponse(findAppointment(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getAllAppointments(Pageable pageable) {
        log.debug("Fetching appointments - page: {}, size: {}, sort: {}",
                pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());
        return appointmentRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsByPatientId(Long patientId) {
        log.debug("Fetching appointments for patientId: {}", patientId);
        return appointmentRepository.findByPatientUserIdOrderByAppointmentDateDesc(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppointmentResponse updateAppointment(Long id, AppointmentRequest request) {
        log.info("Updating appointment with id: {}", id);
        Appointment appointment = findAppointment(id);
        applyChanges(appointment, request);

        AppointmentResponse response = mapToResponse(appointmentRepository.save(appointment));
        log.info("Appointment updated successfully with id: {}", id);
        return response;
    }

    @Override
    @Transactional
    public AppointmentResponse cancelAppointment(Long id) {
        log.info("Cancelling appointment with id: {}", id);
        Appointment appointment = findAppointment(id);
        if (appointment.getStatus() != AppointmentStatus.SCHEDULED) {
            throw new BusinessException("Only scheduled appointments can be cancelled.");
        }
        appointment.setStatus(AppointmentStatus.CANCELLED);

        // Notificare pacient
        notificationService.createNotification(new NotificationRequest() {{
            setUserId(appointment.getPatient().getUserId());
            setType(NotificationType.APPOINTMENT_CANCELLATION);
            setStatus(NotificationStatus.SENT);
            setMessage("Your appointment with Dr. " +
                    appointment.getDoctor().getUser().getFirstName() + " " +
                    appointment.getDoctor().getUser().getLastName() +
                    " on " + appointment.getAppointmentDate().toLocalDate() +
                    " has been cancelled.");
        }});

        // Notificare doctor
        notificationService.createNotification(new NotificationRequest() {{
            setUserId(appointment.getDoctor().getUserId());
            setType(NotificationType.APPOINTMENT_CANCELLATION);
            setStatus(NotificationStatus.SENT);
            setMessage("Appointment with " +
                    appointment.getPatient().getUser().getFirstName() + " " +
                    appointment.getPatient().getUser().getLastName() +
                    " on " + appointment.getAppointmentDate().toLocalDate() +
                    " has been cancelled.");
        }});

        return mapToResponse(appointmentRepository.save(appointment));
    }

    @Override
    @Transactional
    public void deleteAppointment(Long id) {
        log.info("Deleting appointment with id: {}", id);
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

    private Patient getPatient(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", patientId));
    }

    private Doctor getDoctor(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", doctorId));
    }

    private void applyChanges(Appointment appointment, AppointmentRequest request) {
        Patient patient = getPatient(request.getPatientId());
        Doctor doctor = getDoctor(request.getDoctorId());

        if (patient.getUser().getRole() != UserRole.PATIENT) {
            throw new BusinessException("The specified user is not a patient.");
        }
        if (doctor.getUser().getRole() != UserRole.DOCTOR) {
            throw new BusinessException("The specified user is not a doctor.");
        }

        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setDurationMinutes(request.getDurationMinutes());
        appointment.setStatus(request.getStatus());
        appointment.setNotes(request.getNotes());
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
    }

    private AppointmentResponse mapToResponse(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getAppointmentDate(),
                appointment.getDurationMinutes(),
                appointment.getStatus().name(),
                appointment.getNotes(),
                appointment.getPatient().getUserId(),
                buildFullName(
                        appointment.getPatient().getUser().getFirstName(),
                        appointment.getPatient().getUser().getLastName()
                ),
                appointment.getDoctor().getUserId(),
                buildFullName(
                        appointment.getDoctor().getUser().getFirstName(),
                        appointment.getDoctor().getUser().getLastName()
                ),
                appointment.getConsultation() != null ? appointment.getConsultation().getId() : null
        );
    }

    private String buildFullName(String firstName, String lastName) {
        return (firstName + " " + lastName).trim();
    }
}