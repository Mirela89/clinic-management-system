package com.medicareplus.audit;

import java.util.List;

public interface AuditLogService {

    void log(Long userId, AuditAction action, String entityType,
             Long entityId, String details, String ipAddress);

    List<AuditLogResponse> getAllLogs();

    List<AuditLogResponse> getLogsByUserId(Long userId);

    List<AuditLogResponse> getLogsByEntity(String entityType, Long entityId);
}