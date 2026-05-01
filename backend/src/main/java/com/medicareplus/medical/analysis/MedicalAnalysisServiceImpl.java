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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

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
        MedicalAnalysis analysis = new MedicalAnalysis();
        applyChanges(analysis, request);

        return mapToResponse(medicalAnalysisRepository.save(analysis));
    }

    @Override
    public MedicalAnalysisResponse getAnalysisById(Long id) {
        return mapToResponse(findAnalysis(id));
    }

    @Override
    public List<MedicalAnalysisResponse> getAllAnalyses() {
        return medicalAnalysisRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MedicalAnalysisResponse updateAnalysis(Long id, MedicalAnalysisRequest request) {
        MedicalAnalysis analysis = findAnalysis(id);
        applyChanges(analysis, request);

        return mapToResponse(medicalAnalysisRepository.save(analysis));
    }

    @Override
    @Transactional
    public void deleteAnalysis(Long id) {
        MedicalAnalysis analysis = findAnalysis(id);
        medicalAnalysisRepository.delete(analysis);
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
