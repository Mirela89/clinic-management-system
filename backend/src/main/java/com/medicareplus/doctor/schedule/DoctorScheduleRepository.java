package com.medicareplus.doctor.schedule;

import com.medicareplus.doctor.schedule.DoctorSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.DayOfWeek;
import java.util.List;

@Repository
public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {

    List<DoctorSchedule> findByDoctorUserId(Long doctorId);

    boolean existsByDoctorUserIdAndDayOfWeek(Long doctorId, DayOfWeek dayOfWeek);
}