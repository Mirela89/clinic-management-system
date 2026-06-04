package com.medicareplus.medicalservice.medical.consultation;

import com.medicareplus.medicalservice.medical.consultation.ConsultationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ConsultationService {

    ConsultationResponse createConsultation(ConsultationRequest request);

    ConsultationResponse getConsultationById(Long id);

    Page<ConsultationResponse> getAllConsultations(Pageable pageable);

    List<ConsultationResponse> getConsultationsByPatientId(Long patientId);

    ConsultationResponse updateConsultation(Long id, ConsultationRequest request);

    void deleteConsultation(Long id);
}
