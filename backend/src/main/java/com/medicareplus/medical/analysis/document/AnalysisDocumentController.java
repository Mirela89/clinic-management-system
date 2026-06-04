package com.medicareplus.medical.analysis.document;

import com.medicareplus.common.dto.AppResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analysis-documents")
@RequiredArgsConstructor
public class AnalysisDocumentController {

    private final AnalysisDocumentService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<AppResponse<AnalysisDocumentResponse>> save(
            @Valid @RequestBody AnalysisDocumentRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(AppResponse.success("Analysis document saved.", service.saveDocument(request)));
    }

    @GetMapping("/analysis/{analysisId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<AnalysisDocumentResponse>> getByAnalysisId(
            @PathVariable Long analysisId) {
        return service.getByAnalysisId(analysisId)
                .map(doc -> ResponseEntity.ok(AppResponse.success(doc)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<AppResponse<List<AnalysisDocumentResponse>>> getByPatientId(
            @PathVariable Long patientId) {
        return ResponseEntity.ok(AppResponse.success(service.getByPatientId(patientId)));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<AppResponse<List<AnalysisDocumentResponse>>> getByDoctorId(
            @PathVariable Long doctorId) {
        return ResponseEntity.ok(AppResponse.success(service.getByDoctorId(doctorId)));
    }
}