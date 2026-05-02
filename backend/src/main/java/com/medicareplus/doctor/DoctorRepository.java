package com.medicareplus.doctor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    boolean existsByLicenseNumber(String licenseNumber);

    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.doctor.userId = :userId")
    boolean hasAppointments(@Param("userId") Long userId);

    @Query("SELECT COUNT(s) > 0 FROM DoctorSchedule s WHERE s.doctor.userId = :userId")
    boolean hasSchedules(@Param("userId") Long userId);
}
