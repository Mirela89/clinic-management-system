package com.medicareplus.medicalservice.doctor.schedule;

import com.medicareplus.medicalservice.common.dto.AppResponse;
import com.medicareplus.medicalservice.doctor.schedule.DoctorScheduleRequest;
import com.medicareplus.medicalservice.doctor.schedule.DoctorScheduleResponse;
import com.medicareplus.medicalservice.doctor.schedule.DoctorScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctor-schedules")
@RequiredArgsConstructor
@Tag(name = "Doctor Schedules", description = "API for managing doctor schedules")
public class DoctorScheduleController {

    private final DoctorScheduleService scheduleService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get all schedules", description = "Returns all doctor schedules.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Schedules retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<AppResponse<List<DoctorScheduleResponse>>> getAllSchedules() {
        return ResponseEntity.ok(AppResponse.success(scheduleService.getAllSchedules()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get schedule by ID", description = "Returns a single schedule by ID.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Schedule retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Schedule not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<AppResponse<DoctorScheduleResponse>> getScheduleById(
            @Parameter(description = "Schedule ID") @PathVariable Long id) {
        return ResponseEntity.ok(AppResponse.success(scheduleService.getScheduleById(id)));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get schedules by doctor", description = "Returns all schedules for a specific doctor.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Schedules retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Doctor not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<AppResponse<List<DoctorScheduleResponse>>> getSchedulesByDoctorId(
            @Parameter(description = "Doctor user ID") @PathVariable Long doctorId) {
        return ResponseEntity.ok(AppResponse.success(scheduleService.getSchedulesByDoctorId(doctorId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    @Operation(summary = "Create schedule", description = "Creates a new doctor schedule.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Schedule created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or duplicate schedule"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<DoctorScheduleResponse>> createSchedule(
            @Valid @RequestBody DoctorScheduleRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(AppResponse.success("Schedule created successfully.",
                        scheduleService.createSchedule(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    @Operation(summary = "Update schedule", description = "Updates an existing doctor schedule.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Schedule updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Schedule not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<DoctorScheduleResponse>> updateSchedule(
            @Parameter(description = "Schedule ID") @PathVariable Long id,
            @Valid @RequestBody DoctorScheduleRequest request) {
        return ResponseEntity.ok(
                AppResponse.success("Schedule updated successfully.",
                        scheduleService.updateSchedule(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    @Operation(summary = "Delete schedule", description = "Deletes a schedule by ID.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Schedule deleted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Schedule not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<Void>> deleteSchedule(
            @Parameter(description = "Schedule ID") @PathVariable Long id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.ok(AppResponse.success("Schedule deleted successfully.", null));
    }
}