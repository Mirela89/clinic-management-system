package com.medicareplus.userservice.doctor;

import com.medicareplus.userservice.common.dto.AppResponse;
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
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctors", description = "API for managing doctors")
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get all doctors", description = "Returns a list of all doctors.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Doctors retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<AppResponse<List<DoctorResponse>>> getAllDoctors() {
        return ResponseEntity.ok(AppResponse.success(doctorService.getAllDoctors()));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get doctor by ID", description = "Returns a single doctor by user ID.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Doctor retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Doctor not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<AppResponse<DoctorResponse>> getDoctorById(
            @Parameter(description = "Doctor user ID") @PathVariable Long userId) {
        return ResponseEntity.ok(AppResponse.success(doctorService.getDoctorById(userId)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create doctor", description = "Creates a new doctor profile. Admin only.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Doctor created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or invalid relationship"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<DoctorResponse>> createDoctor(
            @Valid @RequestBody DoctorRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(AppResponse.success("Doctor created successfully.", doctorService.createDoctor(request)));
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update doctor", description = "Updates an existing doctor profile. Admin only.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Doctor updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or invalid relationship"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Doctor not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<DoctorResponse>> updateDoctor(
            @Parameter(description = "Doctor user ID") @PathVariable Long userId,
            @Valid @RequestBody DoctorRequest request) {
        return ResponseEntity.ok(
                AppResponse.success("Doctor updated successfully.", doctorService.updateDoctor(userId, request)));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete doctor", description = "Deletes a doctor profile by user ID. Admin only.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Doctor deleted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Doctor not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<Void>> deleteDoctor(
            @Parameter(description = "Doctor user ID") @PathVariable Long userId) {
        doctorService.deleteDoctor(userId);
        return ResponseEntity.ok(AppResponse.success("Doctor deleted successfully.", null));
    }
}
