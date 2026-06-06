package com.medicareplus.userservice.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    boolean existsByCnp(String cnp);

//    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.patient.userId = :userId")
//    boolean hasAppointments(@Param("userId") Long userId);
}
