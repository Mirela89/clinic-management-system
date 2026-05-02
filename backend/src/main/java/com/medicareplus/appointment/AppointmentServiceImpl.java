package com.medicareplus.appointment;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.common.exception.ResourceNotFoundException;
import com.medicareplus.doctor.Doctor;
import com.medicareplus.doctor.DoctorRepository;
import com.medicareplus.patient.Patient;
import com.medicareplus.patient.PatientRepository;
import com.medicareplus.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    @Override
    @Transactional
    public AppointmentResponse createAppointment(AppointmentRequest request) {
        Appointment appointment = new Appointment();
        applyChanges(appointment, request);

        return mapToResponse(appointmentRepository.save(appointment));
    }

    @Override
    public AppointmentResponse getAppointmentById(Long id) {
        return mapToResponse(findAppointment(id));
    }

    @Override
    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppointmentResponse updateAppointment(Long id, AppointmentRequest request) {
        Appointment appointment = findAppointment(id);
        applyChanges(appointment, request);

        return mapToResponse(appointmentRepository.save(appointment));
    }

    @Override
    @Transactional
    public void deleteAppointment(Long id) {
        findAppointment(id);
        if (appointmentRepository.hasConsultation(id)) {
            throw new BusinessException("Appointment cannot be deleted because a consultation is linked to it.");
        }
        appointmentRepository.deleteById(id);
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
