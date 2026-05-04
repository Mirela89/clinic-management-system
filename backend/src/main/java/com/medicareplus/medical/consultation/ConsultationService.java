package com.medicareplus.medical.consultation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ConsultationService {

    ConsultationResponse createConsultation(ConsultationRequest request);

    ConsultationResponse getConsultationById(Long id);

    Page<ConsultationResponse> getAllConsultations(Pageable pageable);

    ConsultationResponse updateConsultation(Long id, ConsultationRequest request);

    void deleteConsultation(Long id);
}
