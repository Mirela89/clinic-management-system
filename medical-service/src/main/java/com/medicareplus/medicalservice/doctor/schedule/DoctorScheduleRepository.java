package com.medicareplus.medicalservice.doctor.schedule;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;

@Repository
public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {

    List<DoctorSchedule> findByDoctorId(Long doctorId);

    boolean existsByDoctorIdAndDayOfWeek(Long doctorId, DayOfWeek dayOfWeek);
}