package com.medicareplus.doctor.schedule;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.common.exception.ResourceNotFoundException;
import com.medicareplus.doctor.Doctor;
import com.medicareplus.doctor.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorScheduleServiceImpl implements DoctorScheduleService {

    private final DoctorScheduleRepository scheduleRepository;
    private final DoctorRepository doctorRepository;

    @Override
    @Transactional
    public DoctorScheduleResponse createSchedule(DoctorScheduleRequest request) {
        Doctor doctor = findDoctor(request.getDoctorId());

        if (scheduleRepository.existsByDoctorUserIdAndDayOfWeek(
                request.getDoctorId(), request.getDayOfWeek())) {
            throw new BusinessException("Schedule already exists for this doctor on "
                    + request.getDayOfWeek());
        }

        validateTimeRange(request);

        DoctorSchedule schedule = new DoctorSchedule();
        applyChanges(schedule, request, doctor);

        return mapToResponse(scheduleRepository.save(schedule));
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorScheduleResponse getScheduleById(Long id) {
        return mapToResponse(findSchedule(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorScheduleResponse> getSchedulesByDoctorId(Long doctorId) {
        findDoctor(doctorId);
        return scheduleRepository.findByDoctorUserId(doctorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorScheduleResponse> getAllSchedules() {
        return scheduleRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DoctorScheduleResponse updateSchedule(Long id, DoctorScheduleRequest request) {
        DoctorSchedule schedule = findSchedule(id);
        Doctor doctor = findDoctor(request.getDoctorId());

        boolean dayChanged = !schedule.getDayOfWeek().equals(request.getDayOfWeek());
        boolean doctorChanged = !schedule.getDoctor().getUserId().equals(request.getDoctorId());

        if ((dayChanged || doctorChanged) &&
                scheduleRepository.existsByDoctorUserIdAndDayOfWeek(
                        request.getDoctorId(), request.getDayOfWeek())) {
            throw new BusinessException("Schedule already exists for this doctor on "
                    + request.getDayOfWeek());
        }

        validateTimeRange(request);
        applyChanges(schedule, request, doctor);

        return mapToResponse(scheduleRepository.save(schedule));
    }

    @Override
    @Transactional
    public void deleteSchedule(Long id) {
        if (!scheduleRepository.existsById(id)) {
            throw new ResourceNotFoundException("DoctorSchedule", id);
        }
        scheduleRepository.deleteById(id);
    }

    private DoctorSchedule findSchedule(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DoctorSchedule", id));
    }

    private Doctor findDoctor(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", doctorId));
    }

    private void validateTimeRange(DoctorScheduleRequest request) {
        if (request.getStartTime().isAfter(request.getEndTime()) ||
                request.getStartTime().equals(request.getEndTime())) {
            throw new BusinessException("Start time must be before end time.");
        }
    }

    private void applyChanges(DoctorSchedule schedule, DoctorScheduleRequest request, Doctor doctor) {
        schedule.setDoctor(doctor);
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setSlotDurationMinutes(request.getSlotDurationMinutes());
        schedule.setIsAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true);
    }

    private DoctorScheduleResponse mapToResponse(DoctorSchedule schedule) {
        Doctor doctor = schedule.getDoctor();
        String fullName = doctor.getUser().getFirstName() + " " + doctor.getUser().getLastName();
        return new DoctorScheduleResponse(
                schedule.getId(),
                doctor.getUserId(),
                fullName,
                schedule.getDayOfWeek(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getSlotDurationMinutes(),
                schedule.getIsAvailable()
        );
    }
}