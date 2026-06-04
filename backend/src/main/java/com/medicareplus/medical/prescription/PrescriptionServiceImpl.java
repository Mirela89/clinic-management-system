package com.medicareplus.medical.prescription;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.common.exception.ResourceNotFoundException;
import com.medicareplus.medical.consultation.Consultation;
import com.medicareplus.medical.consultation.ConsultationRepository;
import com.medicareplus.medical.medication.Medication;
import com.medicareplus.medical.medication.MedicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final ConsultationRepository consultationRepository;
    private final MedicationRepository medicationRepository;

    @Override
    @Transactional
    public PrescriptionResponse createPrescription(PrescriptionRequest request) {
        log.info("Creating prescription for consultationId: {}", request.getConsultationId());
        validateDates(request);

        Prescription prescription = new Prescription();
        applyChanges(prescription, request);

        PrescriptionResponse response = mapToResponse(prescriptionRepository.save(prescription));
        log.info("Prescription created successfully with id: {}", response.getId());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionResponse getPrescriptionById(Long id) {
        log.debug("Fetching prescription with id: {}", id);
        return mapToResponse(findPrescription(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getAllPrescriptions() {
        log.debug("Fetching all prescriptions");
        return prescriptionRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getPrescriptionsByPatientId(Long patientId) {
        log.debug("Fetching prescriptions for patientId: {}", patientId);
        return prescriptionRepository
                .findByConsultationAppointmentPatientUserIdOrderByIssueDateDesc(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PrescriptionResponse updatePrescription(Long id, PrescriptionRequest request) {
        log.info("Updating prescription with id: {}", id);
        validateDates(request);

        Prescription prescription = findPrescription(id);
        applyChanges(prescription, request);

        PrescriptionResponse response = mapToResponse(prescriptionRepository.save(prescription));
        log.info("Prescription updated successfully with id: {}", id);
        return response;
    }

    @Override
    @Transactional
    public void deletePrescription(Long id) {
        log.info("Deleting prescription with id: {}", id);
        findPrescription(id);
        if (prescriptionRepository.hasMedications(id)) {
            throw new BusinessException("Prescription cannot be deleted because medications are linked to it.");
        }
        prescriptionRepository.deleteById(id);
        log.info("Prescription deleted successfully with id: {}", id);
    }

    private Prescription findPrescription(Long id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", id));
    }

    private Consultation getConsultation(Long consultationId) {
        return consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation", consultationId));
    }

    private Medication getMedication(Long medicationId) {
        return medicationRepository.findById(medicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Medication", medicationId));
    }

    private void validateDates(PrescriptionRequest request) {
        if (request.getExpiryDate().isBefore(request.getIssueDate())) {
            throw new BusinessException("Expiry date cannot be before issue date.");
        }
    }

    private void applyChanges(Prescription prescription, PrescriptionRequest request) {
        Consultation consultation = getConsultation(request.getConsultationId());

        prescription.setIssueDate(request.getIssueDate());
        prescription.setExpiryDate(request.getExpiryDate());
        prescription.setInstructions(request.getInstructions());
        prescription.setConsultation(consultation);

        List<PrescriptionMedication> items = buildPrescriptionMedications(
                prescription, request.getMedications());
        if (prescription.getPrescriptionMedications() == null) {
            prescription.setPrescriptionMedications(new ArrayList<>());
        } else {
            prescription.getPrescriptionMedications().clear();
        }
        prescription.getPrescriptionMedications().addAll(items);
    }

    private List<PrescriptionMedication> buildPrescriptionMedications(Prescription prescription, List<PrescriptionMedicationRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return new ArrayList<>();
        }

        Set<Long> medicationIds = new HashSet<>();
        List<PrescriptionMedication> items = new ArrayList<>();

        for (PrescriptionMedicationRequest request : requests) {
            if (!medicationIds.add(request.getMedicationId())) {
                throw new BusinessException("Each medication can be added only once per prescription.");
            }

            Medication medication = getMedication(request.getMedicationId());
            log.debug("Adding medication id: {} to prescription", medication.getId());

            PrescriptionMedication item = new PrescriptionMedication();
            item.setId(new PrescriptionMedicationId());
            item.getId().setPrescriptionId(prescription.getId());
            item.getId().setMedicationId(medication.getId());
            item.setPrescription(prescription);
            item.setMedication(medication);
            item.setQuantity(request.getQuantity());
            item.setFrequency(request.getFrequency());
            item.setDurationDays(request.getDurationDays());

            items.add(item);
        }

        return items;
    }

    private PrescriptionResponse mapToResponse(Prescription prescription) {
        Consultation consultation = prescription.getConsultation();
        var appointment = consultation.getAppointment();

        return new PrescriptionResponse(
                prescription.getId(),
                prescription.getIssueDate(),
                prescription.getExpiryDate(),
                prescription.getInstructions(),
                consultation.getId(),
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
                prescription.getPrescriptionMedications() == null
                        ? List.of()
                        : prescription.getPrescriptionMedications()
                        .stream()
                        .map(this::mapMedicationResponse)
                        .collect(Collectors.toList())
        );
    }

    private PrescriptionMedicationResponse mapMedicationResponse(PrescriptionMedication item) {
        return new PrescriptionMedicationResponse(
                item.getMedication().getId(),
                item.getMedication().getName(),
                item.getMedication().getDosage(),
                item.getQuantity(),
                item.getFrequency() != null ? item.getFrequency().name() : null,
                item.getDurationDays()
        );
    }

    private String buildFullName(String firstName, String lastName) {
        return (firstName + " " + lastName).trim();
    }
}