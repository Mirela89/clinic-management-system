package com.medicareplus.medicalservice.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientIdOrderByAppointmentDateDesc(Long patientId);

    List<Appointment> findByDoctorIdOrderByAppointmentDateDesc(Long doctorId);

    @Query("SELECT COUNT(c) > 0 FROM Consultation c WHERE c.appointment.id = :appointmentId")
    boolean hasConsultation(@Param("appointmentId") Long appointmentId);
}
