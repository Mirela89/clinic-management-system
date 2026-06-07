package com.medicareplus.userservice.audit;

import com.medicareplus.userservice.audit.AuditAction;
import com.medicareplus.userservice.audit.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
            String entityType, Long entityId);

    List<AuditLog> findByActionOrderByCreatedAtDesc(AuditAction action);
}