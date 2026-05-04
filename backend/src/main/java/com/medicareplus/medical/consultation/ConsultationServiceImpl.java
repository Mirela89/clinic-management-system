package com.medicareplus.medical.consultation;

import com.medicareplus.appointment.Appointment;
import com.medicareplus.appointment.AppointmentRepository;
import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConsultationServiceImpl implements ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final AppointmentRepository appointmentRepository;

    @Override
    @Transactional
    public ConsultationResponse createConsultation(ConsultationRequest request) {
        validateAppointmentAvailability(request.getAppointmentId(), null);

        Consultation consultation = new Consultation();
        applyChanges(consultation, request);

        return mapToResponse(consultationRepository.save(consultation));
    }

    @Override
    @Transactional(readOnly = true)
    public ConsultationResponse getConsultationById(Long id) {
        return mapToResponse(findConsultation(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConsultationResponse> getAllConsultations() {
        return consultationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ConsultationResponse updateConsultation(Long id, ConsultationRequest request) {
        Consultation consultation = findConsultation(id);
        validateAppointmentAvailability(request.getAppointmentId(), consultation.getAppointment().getId());

        applyChanges(consultation, request);

        return mapToResponse(consultationRepository.save(consultation));
    }

    @Override
    @Transactional
    public void deleteConsultation(Long id) {
        findConsultation(id);
        if (consultationRepository.hasPrescriptions(id)) {
            throw new BusinessException("Consultation cannot be deleted because prescriptions are linked to it.");
        }
        if (consultationRepository.hasAnalyses(id)) {
            throw new BusinessException("Consultation cannot be deleted because analyses are linked to it.");
        }
        consultationRepository.deleteById(id);
    }

    private Consultation findConsultation(Long id) {
        return consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation", id));
    }

    private Appointment getAppointment(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", appointmentId));
    }

    private void validateAppointmentAvailability(Long requestedAppointmentId, Long currentAppointmentId) {
        if (!requestedAppointmentId.equals(currentAppointmentId) &&
                consultationRepository.existsByAppointment_Id(requestedAppointmentId)) {
            throw new BusinessException("A consultation already exists for this appointment.");
        }
    }

    private void applyChanges(Consultation consultation, ConsultationRequest request) {
        Appointment appointment = getAppointment(request.getAppointmentId());

        consultation.setDiagnosis(request.getDiagnosis());
        consultation.setNotes(request.getNotes());
        consultation.setConsultationDate(request.getConsultationDate());
        consultation.setAppointment(appointment);
    }

    private ConsultationResponse mapToResponse(Consultation consultation) {
        Appointment appointment = consultation.getAppointment();
        return new ConsultationResponse(
                consultation.getId(),
                consultation.getDiagnosis(),
                consultation.getNotes(),
                consultation.getConsultationDate(),
                appointment.getId(),
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
                consultation.getPrescriptions() != null ? consultation.getPrescriptions().size() : 0,
                consultation.getAnalyses() != null ? consultation.getAnalyses().size() : 0
        );
    }

    private String buildFullName(String firstName, String lastName) {
        return (firstName + " " + lastName).trim();
    }
}
