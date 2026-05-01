package com.medicareplus.medical.consultation;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    boolean existsByAppointment_Id(Long appointmentId);
}
