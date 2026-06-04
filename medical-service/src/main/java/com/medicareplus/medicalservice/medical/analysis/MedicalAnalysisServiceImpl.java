package com.medicareplus.medicalservice.medical.analysis;

import com.medicareplus.medicalservice.client.UserServiceClient;
import com.medicareplus.medicalservice.common.exception.BusinessException;
import com.medicareplus.medicalservice.common.exception.ResourceNotFoundException;
import com.medicareplus.medicalservice.medical.analysis.document.AnalysisDocumentService;
import com.medicareplus.medicalservice.medical.consultation.Consultation;
import com.medicareplus.medicalservice.medical.consultation.ConsultationRepository;
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
    private final ConsultationRepository consultationRepository;
    private final AnalysisDocumentService analysisDocumentService;
    private final UserServiceClient userServiceClient;

    @Override
    @Transactional
    public MedicalAnalysisResponse createAnalysis(MedicalAnalysisRequest request) {
        UserServiceClient.PatientDto patient = userServiceClient.getPatient(request.getPatientId()).getData();
        UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(request.getDoctorId()).getData();

        MedicalAnalysis analysis = new MedicalAnalysis();
        applyChanges(analysis, request, patient, doctor);

        MedicalAnalysisResponse response = mapToResponse(medicalAnalysisRepository.save(analysis), patient, doctor);
        log.info("Medical analysis created with id: {}", response.getId());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalAnalysisResponse getAnalysisById(Long id) {
        MedicalAnalysis analysis = findAnalysis(id);
        UserServiceClient.PatientDto patient = userServiceClient.getPatient(analysis.getPatientId()).getData();
        UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(analysis.getDoctorId()).getData();
        return mapToResponse(analysis, patient, doctor);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalAnalysisResponse> getAllAnalyses() {
        return medicalAnalysisRepository.findAll()
                .stream()
                .map(analysis -> {
                    UserServiceClient.PatientDto patient = userServiceClient.getPatient(analysis.getPatientId()).getData();
                    UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(analysis.getDoctorId()).getData();
                    return mapToResponse(analysis, patient, doctor);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MedicalAnalysisResponse updateAnalysis(Long id, MedicalAnalysisRequest request) {
        MedicalAnalysis analysis = findAnalysis(id);
        UserServiceClient.PatientDto patient = userServiceClient.getPatient(request.getPatientId()).getData();
        UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(request.getDoctorId()).getData();

        applyChanges(analysis, request, patient, doctor);
        MedicalAnalysisResponse response = mapToResponse(medicalAnalysisRepository.save(analysis), patient, doctor);
        log.info("Medical analysis updated with id: {}", id);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalAnalysisResponse> getAnalysesByPatientId(Long patientId) {
        UserServiceClient.PatientDto patient = userServiceClient.getPatient(patientId).getData();
        return medicalAnalysisRepository.findByPatientId(patientId)
                .stream()
                .map(analysis -> {
                    UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(analysis.getDoctorId()).getData();
                    return mapToResponse(analysis, patient, doctor);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalAnalysisResponse> getAnalysesByDoctorId(Long doctorId) {
        UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(doctorId).getData();
        return medicalAnalysisRepository.findByDoctorId(doctorId)
                .stream()
                .map(analysis -> {
                    UserServiceClient.PatientDto patient = userServiceClient.getPatient(analysis.getPatientId()).getData();
                    return mapToResponse(analysis, patient, doctor);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteAnalysis(Long id) {
        findAnalysis(id);
        medicalAnalysisRepository.deleteById(id);
        log.info("Medical analysis deleted with id: {}", id);
    }

    private MedicalAnalysis findAnalysis(Long id) {
        return medicalAnalysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical analysis", id));
    }

    private Consultation getConsultation(Long consultationId) {
        if (consultationId == null) return null;
        return consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation", consultationId));
    }

    private void applyChanges(MedicalAnalysis analysis, MedicalAnalysisRequest request,
                              UserServiceClient.PatientDto patient,
                              UserServiceClient.DoctorDto doctor) {
        Consultation consultation = getConsultation(request.getConsultationId());

        if (consultation != null) {
            if (!consultation.getPatientId().equals(request.getPatientId())) {
                throw new BusinessException("Consultation does not belong to the specified patient.");
            }
            if (!consultation.getDoctorId().equals(request.getDoctorId())) {
                throw new BusinessException("Consultation does not belong to the specified doctor.");
            }
        }

        if (request.getResultDate() != null &&
                request.getResultDate().isBefore(request.getRequestedDate())) {
            throw new BusinessException("Result date cannot be before requested date.");
        }

        analysis.setPatientId(request.getPatientId());
        analysis.setDoctorId(request.getDoctorId());
        analysis.setConsultation(consultation);
        analysis.setAnalysisType(request.getAnalysisType());
        analysis.setStatus(request.getStatus());
        analysis.setRequestedDate(request.getRequestedDate());
        analysis.setResultDate(request.getResultDate());
        analysis.setMongoDocumentId(request.getMongoDocumentId());
    }

    private MedicalAnalysisResponse mapToResponse(MedicalAnalysis analysis,
                                                  UserServiceClient.PatientDto patient,
                                                  UserServiceClient.DoctorDto doctor) {
        return new MedicalAnalysisResponse(
                analysis.getId(),
                analysis.getPatientId(),
                patient.getFirstName() + " " + patient.getLastName(),
                analysis.getDoctorId(),
                doctor.getFirstName() + " " + doctor.getLastName(),
                analysis.getConsultation() != null ? analysis.getConsultation().getId() : null,
                analysis.getAnalysisType().name(),
                analysis.getStatus().name(),
                analysis.getRequestedDate(),
                analysis.getResultDate(),
                analysis.getMongoDocumentId()
        );
    }
}