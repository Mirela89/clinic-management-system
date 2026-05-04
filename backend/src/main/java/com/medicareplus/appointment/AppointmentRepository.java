package com.medicareplus.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("SELECT COUNT(c) > 0 FROM Consultation c WHERE c.appointment.id = :id")
    boolean hasConsultation(@Param("id") Long id);
}
