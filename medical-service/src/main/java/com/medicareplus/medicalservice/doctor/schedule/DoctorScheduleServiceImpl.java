package com.medicareplus.medicalservice.doctor.schedule;

import com.medicareplus.medicalservice.client.UserServiceClient;
import com.medicareplus.medicalservice.common.exception.BusinessException;
import com.medicareplus.medicalservice.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DoctorScheduleServiceImpl implements DoctorScheduleService {

    private final DoctorScheduleRepository scheduleRepository;
    private final UserServiceClient userServiceClient;

    @Override
    @Transactional
    public DoctorScheduleResponse createSchedule(DoctorScheduleRequest request) {
        log.info("Creating schedule for doctorId: {} on {}", request.getDoctorId(), request.getDayOfWeek());
        UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(request.getDoctorId()).getData();

        if (scheduleRepository.existsByDoctorIdAndDayOfWeek(request.getDoctorId(), request.getDayOfWeek())) {
            throw new BusinessException("Schedule already exists for this doctor on " + request.getDayOfWeek());
        }
        validateTimeRange(request);

        DoctorSchedule schedule = new DoctorSchedule();
        applyChanges(schedule, request);

        DoctorScheduleResponse response = mapToResponse(scheduleRepository.save(schedule), doctor);
        log.info("Schedule created successfully with id: {}", response.getId());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorScheduleResponse getScheduleById(Long id) {
        DoctorSchedule schedule = findSchedule(id);
        UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(schedule.getDoctorId()).getData();
        return mapToResponse(schedule, doctor);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorScheduleResponse> getSchedulesByDoctorId(Long doctorId) {
        UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(doctorId).getData();
        return scheduleRepository.findByDoctorId(doctorId)
                .stream()
                .map(schedule -> mapToResponse(schedule, doctor))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorScheduleResponse> getAllSchedules() {
        return scheduleRepository.findAll()
                .stream()
                .map(schedule -> {
                    UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(schedule.getDoctorId()).getData();
                    return mapToResponse(schedule, doctor);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DoctorScheduleResponse updateSchedule(Long id, DoctorScheduleRequest request) {
        log.info("Updating schedule with id: {}", id);
        DoctorSchedule schedule = findSchedule(id);
        UserServiceClient.DoctorDto doctor = userServiceClient.getDoctor(request.getDoctorId()).getData();

        boolean dayChanged = !schedule.getDayOfWeek().equals(request.getDayOfWeek());
        boolean doctorChanged = !schedule.getDoctorId().equals(request.getDoctorId());

        if ((dayChanged || doctorChanged) &&
                scheduleRepository.existsByDoctorIdAndDayOfWeek(request.getDoctorId(), request.getDayOfWeek())) {
            throw new BusinessException("Schedule already exists for this doctor on " + request.getDayOfWeek());
        }

        validateTimeRange(request);
        applyChanges(schedule, request);

        DoctorScheduleResponse response = mapToResponse(scheduleRepository.save(schedule), doctor);
        log.info("Schedule updated successfully with id: {}", id);
        return response;
    }

    @Override
    @Transactional
    public void deleteSchedule(Long id) {
        log.info("Deleting schedule with id: {}", id);
        if (!scheduleRepository.existsById(id)) {
            throw new ResourceNotFoundException("DoctorSchedule", id);
        }
        scheduleRepository.deleteById(id);
    }

    private DoctorSchedule findSchedule(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DoctorSchedule", id));
    }

    private void validateTimeRange(DoctorScheduleRequest request) {
        if (request.getStartTime().isAfter(request.getEndTime()) ||
                request.getStartTime().equals(request.getEndTime())) {
            throw new BusinessException("Start time must be before end time.");
        }
    }

    private void applyChanges(DoctorSchedule schedule, DoctorScheduleRequest request) {
        schedule.setDoctorId(request.getDoctorId());
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setSlotDurationMinutes(request.getSlotDurationMinutes());
        schedule.setIsAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true);
    }

    private DoctorScheduleResponse mapToResponse(DoctorSchedule schedule, UserServiceClient.DoctorDto doctor) {
        String fullName = doctor.getFirstName() + " " + doctor.getLastName();
        return new DoctorScheduleResponse(
                schedule.getId(),
                schedule.getDoctorId(),
                fullName,
                schedule.getDayOfWeek(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getSlotDurationMinutes(),
                schedule.getIsAvailable()
        );
    }
}