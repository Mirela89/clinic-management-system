package com.medicareplus.medical.consultation;

import com.medicareplus.appointment.Appointment;
import com.medicareplus.appointment.AppointmentRepository;
import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.common.exception.ResourceNotFoundException;
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
public class ConsultationServiceImpl implements ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final AppointmentRepository appointmentRepository;

    @Override
    @Transactional
    public ConsultationResponse createConsultation(ConsultationRequest request) {
        log.info("Creating consultation for appointmentId: {}", request.getAppointmentId());
        validateAppointmentAvailability(request.getAppointmentId(), null);

        Consultation consultation = new Consultation();
        applyChanges(consultation, request);

        ConsultationResponse response = mapToResponse(consultationRepository.save(consultation));
        log.info("Consultation created successfully with id: {}", response.getId());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public ConsultationResponse getConsultationById(Long id) {
        log.debug("Fetching consultation with id: {}", id);
        return mapToResponse(findConsultation(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConsultationResponse> getAllConsultations(Pageable pageable) {
        log.debug("Fetching consultations - page: {}, size: {}, sort: {}",
                pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());
        return consultationRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public ConsultationResponse updateConsultation(Long id, ConsultationRequest request) {
        log.info("Updating consultation with id: {}", id);
        Consultation consultation = findConsultation(id);
        validateAppointmentAvailability(request.getAppointmentId(), consultation.getAppointment().getId());

        applyChanges(consultation, request);

        ConsultationResponse response = mapToResponse(consultationRepository.save(consultation));
        log.info("Consultation updated successfully with id: {}", id);
        return response;
    }

    @Override
    @Transactional
    public void deleteConsultation(Long id) {
        log.info("Deleting consultation with id: {}", id);
        findConsultation(id);
        if (consultationRepository.hasPrescriptions(id)) {
            throw new BusinessException("Consultation cannot be deleted because prescriptions are linked to it.");
        }
        if (consultationRepository.hasAnalyses(id)) {
            throw new BusinessException("Consultation cannot be deleted because analyses are linked to it.");
        }
        consultationRepository.deleteById(id);
        log.info("Consultation deleted successfully with id: {}", id);
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