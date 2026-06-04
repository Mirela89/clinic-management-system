package com.medicareplus.medicalservice.medical.analysis;

import com.medicareplus.medicalservice.common.dto.AppResponse;
import com.medicareplus.medicalservice.medical.analysis.MedicalAnalysisResponse;
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
@RequestMapping("/api/analyses")
@RequiredArgsConstructor
@Tag(name = "Medical Analyses", description = "API for managing medical analyses")
public class MedicalAnalysisController {

    private final MedicalAnalysisService medicalAnalysisService;

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Operation(summary = "Get all analyses", description = "Returns a list of all medical analyses.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Analyses retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<List<MedicalAnalysisResponse>>> getAllAnalyses() {
        return ResponseEntity.ok(AppResponse.success(medicalAnalysisService.getAllAnalyses()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Operation(summary = "Get analysis by ID", description = "Returns a single medical analysis by ID.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Analysis retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Analysis not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<MedicalAnalysisResponse>> getAnalysisById(
            @Parameter(description = "Analysis ID") @PathVariable Long id) {
        return ResponseEntity.ok(AppResponse.success(medicalAnalysisService.getAnalysisById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Operation(summary = "Create analysis", description = "Creates a new medical analysis.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Analysis created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or invalid relationship"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<MedicalAnalysisResponse>> createAnalysis(
            @Valid @RequestBody MedicalAnalysisRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(AppResponse.success("Medical analysis created successfully.", medicalAnalysisService.createAnalysis(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Operation(summary = "Update analysis", description = "Updates an existing medical analysis.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Analysis updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or invalid relationship"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Analysis not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<MedicalAnalysisResponse>> updateAnalysis(
            @Parameter(description = "Analysis ID") @PathVariable Long id,
            @Valid @RequestBody MedicalAnalysisRequest request) {
        return ResponseEntity.ok(
                AppResponse.success("Medical analysis updated successfully.", medicalAnalysisService.updateAnalysis(id, request)));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    @Operation(summary = "Get analyses by patient")
    public ResponseEntity<AppResponse<List<MedicalAnalysisResponse>>> getAnalysesByPatient(
            @PathVariable Long patientId) {
        return ResponseEntity.ok(AppResponse.success(
                medicalAnalysisService.getAnalysesByPatientId(patientId)));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Operation(summary = "Get analyses by doctor")
    public ResponseEntity<AppResponse<List<MedicalAnalysisResponse>>> getAnalysesByDoctor(
            @PathVariable Long doctorId) {
        return ResponseEntity.ok(AppResponse.success(
                medicalAnalysisService.getAnalysesByDoctorId(doctorId)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Operation(summary = "Delete analysis", description = "Deletes a medical analysis by ID.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Analysis deleted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Analysis not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<Void>> deleteAnalysis(
            @Parameter(description = "Analysis ID") @PathVariable Long id) {
        medicalAnalysisService.deleteAnalysis(id);
        return ResponseEntity.ok(AppResponse.success("Medical analysis deleted successfully.", null));
    }
}
