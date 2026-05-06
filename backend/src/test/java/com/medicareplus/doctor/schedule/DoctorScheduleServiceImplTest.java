package com.medicareplus.doctor.schedule;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.common.exception.ResourceNotFoundException;
import com.medicareplus.doctor.Doctor;
import com.medicareplus.doctor.DoctorRepository;
import com.medicareplus.support.TestDataFactory;
import com.medicareplus.user.User;
import com.medicareplus.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorScheduleServiceImplTest {

    @Mock
    private DoctorScheduleRepository scheduleRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private DoctorScheduleServiceImpl service;

    @Test
    void createScheduleShouldDefaultAvailabilityToTrue() {
        User user = TestDataFactory.user(1L, "doctor", UserRole.DOCTOR);
        Doctor doctor = TestDataFactory.doctor(user);
        DoctorScheduleRequest request = new DoctorScheduleRequest();
        request.setDoctorId(1L);
        request.setDayOfWeek(DayOfWeek.MONDAY);
        request.setStartTime(LocalTime.of(9, 0));
        request.setEndTime(LocalTime.of(12, 0));
        request.setSlotDurationMinutes(30);
        request.setIsAvailable(null);

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(scheduleRepository.save(any(DoctorSchedule.class))).thenAnswer(invocation -> {
            DoctorSchedule schedule = invocation.getArgument(0);
            schedule.setId(10L);
            return schedule;
        });

        DoctorScheduleResponse response = service.createSchedule(request);

        assertEquals(10L, response.getId());
        assertEquals(true, response.getIsAvailable());
    }

    @Test
    void createScheduleShouldRejectDuplicateDay() {
        User user = TestDataFactory.user(2L, "doctor2", UserRole.DOCTOR);
        Doctor doctor = TestDataFactory.doctor(user);
        DoctorScheduleRequest request = new DoctorScheduleRequest();
        request.setDoctorId(2L);
        request.setDayOfWeek(DayOfWeek.TUESDAY);
        request.setStartTime(LocalTime.of(9, 0));
        request.setEndTime(LocalTime.of(11, 0));
        request.setSlotDurationMinutes(20);

        when(doctorRepository.findById(2L)).thenReturn(Optional.of(doctor));
        when(scheduleRepository.existsByDoctorUserIdAndDayOfWeek(2L, DayOfWeek.TUESDAY)).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.createSchedule(request));
    }

    @Test
    void getSchedulesByDoctorIdShouldMapResults() {
        User user = TestDataFactory.user(3L, "doctor3", UserRole.DOCTOR);
        Doctor doctor = TestDataFactory.doctor(user);
        DoctorSchedule schedule = TestDataFactory.schedule(11L, doctor);
        when(doctorRepository.findById(3L)).thenReturn(Optional.of(doctor));
        when(scheduleRepository.findByDoctorUserId(3L)).thenReturn(List.of(schedule));

        List<DoctorScheduleResponse> responses = service.getSchedulesByDoctorId(3L);

        assertEquals(1, responses.size());
        assertEquals("First3 Last3", responses.getFirst().getDoctorFullName());
    }

    @Test
    void updateScheduleShouldRejectInvalidTimeRange() {
        User user = TestDataFactory.user(4L, "doctor4", UserRole.DOCTOR);
        Doctor doctor = TestDataFactory.doctor(user);
        DoctorSchedule existing = TestDataFactory.schedule(12L, doctor);
        DoctorScheduleRequest request = new DoctorScheduleRequest();
        request.setDoctorId(4L);
        request.setDayOfWeek(DayOfWeek.MONDAY);
        request.setStartTime(LocalTime.of(12, 0));
        request.setEndTime(LocalTime.of(12, 0));
        request.setSlotDurationMinutes(15);

        when(scheduleRepository.findById(12L)).thenReturn(Optional.of(existing));
        when(doctorRepository.findById(4L)).thenReturn(Optional.of(doctor));

        assertThrows(BusinessException.class, () -> service.updateSchedule(12L, request));
    }

    @Test
    void deleteScheduleShouldThrowWhenMissing() {
        when(scheduleRepository.existsById(99L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> service.deleteSchedule(99L));
    }
}
