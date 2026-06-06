package com.medicareplus.userservice.audit;

import com.medicareplus.userservice.audit.AuditLogResponse;
import com.medicareplus.userservice.common.dto.AppResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@Tag(name = "Audit Logs", description = "API for viewing audit logs. Admin only.")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all audit logs")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Logs retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<List<AuditLogResponse>>> getAllLogs() {
        return ResponseEntity.ok(AppResponse.success(auditLogService.getAllLogs()));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get audit logs by user")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Logs retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<List<AuditLogResponse>>> getLogsByUser(
            @Parameter(description = "User ID") @PathVariable Long userId) {
        return ResponseEntity.ok(AppResponse.success(auditLogService.getLogsByUserId(userId)));
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get audit logs by entity")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Logs retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<AppResponse<List<AuditLogResponse>>> getLogsByEntity(
            @Parameter(description = "Entity type e.g. Patient, Doctor") @PathVariable String entityType,
            @Parameter(description = "Entity ID") @PathVariable Long entityId) {
        return ResponseEntity.ok(AppResponse.success(
                auditLogService.getLogsByEntity(entityType, entityId)));
    }
}