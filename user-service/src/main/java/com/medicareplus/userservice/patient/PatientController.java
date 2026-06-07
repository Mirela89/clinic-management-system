package com.medicareplus.userservice.patient;

import com.medicareplus.userservice.common.dto.AppResponse;
import com.medicareplus.userservice.patient.PatientRequest;
import com.medicareplus.userservice.patient.PatientResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@Tag(name = "Patients", description = "API for managing patients")
public class PatientController {

    private final PatientService patientService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get all patients", description = "Returns a paginated list of patients.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Patients retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<AppResponse<Page<PatientResponse>>> getAllPatients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "dateOfBirth") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Pageable pageable = PageRequest.of(
                page, size,
                sortDir.equalsIgnoreCase("asc") ?
                        Sort.by(sortBy).ascending() :
                        Sort.by(sortBy).descending()
        );
        return ResponseEntity.ok(AppResponse.success(patientService.getAllPatients(pageable)));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get patient by ID", description = "Returns a single patient by user ID.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Patient retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Patient not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<AppResponse<PatientResponse>> getPatientById(
            @Parameter(description = "Patient user ID") @PathVariable Long userId) {
        return ResponseEntity.ok(AppResponse.success(patientService.getPatientById(userId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PATIENT')")
    @Operation(summary = "Create patient", description = "Creates a new patient profile.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Patient created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or invalid relationship"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<PatientResponse>> createPatient(
            @Valid @RequestBody PatientRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(AppResponse.success("Patient created successfully.", patientService.createPatient(request)));
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update patient", description = "Updates an existing patient profile. Admin only.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Patient updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or invalid relationship"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Patient not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<PatientResponse>> updatePatient(
            @Parameter(description = "Patient user ID") @PathVariable Long userId,
            @Valid @RequestBody PatientRequest request) {
        return ResponseEntity.ok(
                AppResponse.success("Patient updated successfully.", patientService.updatePatient(userId, request)));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete patient", description = "Deletes a patient profile by user ID. Admin only.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Patient deleted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Patient not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<Void>> deletePatient(
            @Parameter(description = "Patient user ID") @PathVariable Long userId) {
        patientService.deletePatient(userId);
        return ResponseEntity.ok(AppResponse.success("Patient deleted successfully.", null));
    }
}
