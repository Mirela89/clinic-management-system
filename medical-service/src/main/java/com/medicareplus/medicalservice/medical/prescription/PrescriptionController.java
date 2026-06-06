package com.medicareplus.medicalservice.medical.prescription;

import com.medicareplus.medicalservice.common.dto.AppResponse;
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
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
@Tag(name = "Prescriptions", description = "API for managing prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Operation(summary = "Get all prescriptions", description = "Returns a list of all prescriptions.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Prescriptions retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<List<PrescriptionResponse>>> getAllPrescriptions() {
        return ResponseEntity.ok(AppResponse.success(prescriptionService.getAllPrescriptions()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Operation(summary = "Get prescription by ID", description = "Returns a single prescription by ID.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Prescription retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Prescription not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<PrescriptionResponse>> getPrescriptionById(
            @Parameter(description = "Prescription ID") @PathVariable Long id) {
        return ResponseEntity.ok(AppResponse.success(prescriptionService.getPrescriptionById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Operation(summary = "Create prescription", description = "Creates a new prescription.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Prescription created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or invalid relationship"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<PrescriptionResponse>> createPrescription(
            @Valid @RequestBody PrescriptionRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(AppResponse.success("Prescription created successfully.", prescriptionService.createPrescription(request)));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    @Operation(summary = "Get prescriptions by patient")
    public ResponseEntity<AppResponse<List<PrescriptionResponse>>> getPrescriptionsByPatient(
            @Parameter(description = "Patient ID") @PathVariable Long patientId) {
        return ResponseEntity.ok(AppResponse.success(
                prescriptionService.getPrescriptionsByPatientId(patientId)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Operation(summary = "Update prescription", description = "Updates an existing prescription.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Prescription updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or invalid relationship"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Prescription not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<PrescriptionResponse>> updatePrescription(
            @Parameter(description = "Prescription ID") @PathVariable Long id,
            @Valid @RequestBody PrescriptionRequest request) {
        return ResponseEntity.ok(
                AppResponse.success("Prescription updated successfully.", prescriptionService.updatePrescription(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Operation(summary = "Delete prescription", description = "Deletes a prescription by ID.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Prescription deleted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Prescription not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<Void>> deletePrescription(
            @Parameter(description = "Prescription ID") @PathVariable Long id) {
        prescriptionService.deletePrescription(id);
        return ResponseEntity.ok(AppResponse.success("Prescription deleted successfully.", null));
    }
}
