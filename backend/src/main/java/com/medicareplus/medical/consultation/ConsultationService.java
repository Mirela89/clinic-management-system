package com.medicareplus.medical.consultation;

import java.util.List;

public interface ConsultationService {

    ConsultationResponse createConsultation(ConsultationRequest request);

    ConsultationResponse getConsultationById(Long id);

    List<ConsultationResponse> getAllConsultations();

    ConsultationResponse updateConsultation(Long id, ConsultationRequest request);

    void deleteConsultation(Long id);
}
