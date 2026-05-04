package com.medicareplus.medical.analysis;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.common.exception.ResourceNotFoundException;
import com.medicareplus.doctor.Doctor;
import com.medicareplus.doctor.DoctorRepository;
import com.medicareplus.medical.consultation.Consultation;
import com.medicareplus.medical.consultation.ConsultationRepository;
import com.medicareplus.patient.Patient;
import com.medicareplus.patient.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicalAnalysisServiceImpl implements MedicalAnalysisService {

    private final MedicalAnalysisRepository medicalAnalysisRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final ConsultationRepository consultationRepository;

    @Override
    @Transactional
    public MedicalAnalysisResponse createAnalysis(MedicalAnalysisRequest request) {
        log.info("Creating medical analysis for patientId: {} with doctorId: {}",
                request.getPatientId(), request.getDoctorId());

        MedicalAnalysis analysis = new MedicalAnalysis();
        applyChanges(analysis, request);

        MedicalAnalysisResponse response = mapToResponse(medicalAnalysisRepository.save(analysis));
        log.info("Medical analysis created successfully with id: {}", response.getId());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalAnalysisResponse getAnalysisById(Long id) {
        log.debug("Fetching medical analysis with id: {}", id);
        return mapToResponse(findAnalysis(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalAnalysisResponse> getAllAnalyses() {
        log.debug("Fetching all medical analyses");
        return medicalAnalysisRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MedicalAnalysisResponse updateAnalysis(Long id, MedicalAnalysisRequest request) {
        log.info("Updating medical analysis with id: {}", id);
        MedicalAnalysis analysis = findAnalysis(id);
        applyChanges(analysis, request);

        MedicalAnalysisResponse response = mapToResponse(medicalAnalysisRepository.save(analysis));
        log.info("Medical analysis updated successfully with id: {}", id);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalAnalysisResponse> getAnalysesByPatientId(Long patientId) {
        log.debug("Fetching medical analyses for patientId: {}", patientId);
        return medicalAnalysisRepository.findByPatientUserId(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalAnalysisResponse> getAnalysesByDoctorId(Long doctorId) {
        log.debug("Fetching medical analyses for doctorId: {}", doctorId);
        return medicalAnalysisRepository.findByDoctorUserId(doctorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteAnalysis(Long id) {
        log.info("Deleting medical analysis with id: {}", id);
        findAnalysis(id);
        medicalAnalysisRepository.deleteById(id);
        log.info("Medical analysis deleted successfully with id: {}", id);
    }

    private MedicalAnalysis findAnalysis(Long id) {
        return medicalAnalysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical analysis", id));
    }

    private Patient getPatient(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", patientId));
    }

    private Doctor getDoctor(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", doctorId));
    }

    private Consultation getConsultation(Long consultationId) {
        if (consultationId == null) {
            return null;
        }
        return consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation", consultationId));
    }

    private void applyChanges(MedicalAnalysis analysis, MedicalAnalysisRequest request) {
        Patient patient = getPatient(request.getPatientId());
        Doctor doctor = getDoctor(request.getDoctorId());
        Consultation consultation = getConsultation(request.getConsultationId());

        if (consultation != null) {
            Long consultationPatientId = consultation.getAppointment().getPatient().getUserId();
            Long consultationDoctorId = consultation.getAppointment().getDoctor().getUserId();
            if (!consultationPatientId.equals(patient.getUserId())) {
                throw new BusinessException("Consultation does not belong to the specified patient.");
            }
            if (!consultationDoctorId.equals(doctor.getUserId())) {
                throw new BusinessException("Consultation does not belong to the specified doctor.");
            }
        }

        if (request.getResultDate() != null && request.getResultDate().isBefore(request.getRequestedDate())) {
            throw new BusinessException("Result date cannot be before requested date.");
        }

        analysis.setPatient(patient);
        analysis.setDoctor(doctor);
        analysis.setConsultation(consultation);
        analysis.setAnalysisType(request.getAnalysisType());
        analysis.setStatus(request.getStatus());
        analysis.setRequestedDate(request.getRequestedDate());
        analysis.setResultDate(request.getResultDate());
        analysis.setMongoDocumentId(request.getMongoDocumentId());
    }

    private MedicalAnalysisResponse mapToResponse(MedicalAnalysis analysis) {
        return new MedicalAnalysisResponse(
                analysis.getId(),
                analysis.getPatient().getUserId(),
                buildFullName(
                        analysis.getPatient().getUser().getFirstName(),
                        analysis.getPatient().getUser().getLastName()
                ),
                analysis.getDoctor().getUserId(),
                buildFullName(
                        analysis.getDoctor().getUser().getFirstName(),
                        analysis.getDoctor().getUser().getLastName()
                ),
                analysis.getConsultation() != null ? analysis.getConsultation().getId() : null,
                analysis.getAnalysisType().name(),
                analysis.getStatus().name(),
                analysis.getRequestedDate(),
                analysis.getResultDate(),
                analysis.getMongoDocumentId()
        );
    }

    private String buildFullName(String firstName, String lastName) {
        return (firstName + " " + lastName).trim();
    }
}