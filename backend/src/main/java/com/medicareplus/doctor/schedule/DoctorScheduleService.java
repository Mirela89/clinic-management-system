package com.medicareplus.doctor.schedule;

import java.util.List;

public interface DoctorScheduleService {

    DoctorScheduleResponse createSchedule(DoctorScheduleRequest request);

    DoctorScheduleResponse getScheduleById(Long id);

    List<DoctorScheduleResponse> getSchedulesByDoctorId(Long doctorId);

    List<DoctorScheduleResponse> getAllSchedules();

    DoctorScheduleResponse updateSchedule(Long id, DoctorScheduleRequest request);

    void deleteSchedule(Long id);
}