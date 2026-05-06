package com.medicareplus.audit;

import com.medicareplus.support.TestDataFactory;
import com.medicareplus.user.User;
import com.medicareplus.user.UserRepository;
import com.medicareplus.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceImplTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuditLogServiceImpl service;

    @Test
    void logShouldAttachExistingUser() {
        User user = TestDataFactory.user(1L, "alice", UserRole.ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        service.log(1L, AuditAction.CREATE, "User", 10L, "created", "127.0.0.1");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());

        AuditLog saved = captor.getValue();
        assertEquals(user, saved.getUser());
        assertEquals(AuditAction.CREATE, saved.getAction());
        assertEquals("User", saved.getEntityType());
        assertEquals(10L, saved.getEntityId());
    }

    @Test
    void getAllLogsShouldMapSystemUsernameWhenUserIsMissing() {
        AuditLog log = TestDataFactory.auditLog(7L, null, AuditAction.DELETE);
        when(auditLogRepository.findAll()).thenReturn(List.of(log));

        List<AuditLogResponse> responses = service.getAllLogs();

        assertEquals(1, responses.size());
        assertNull(responses.getFirst().getUserId());
        assertEquals("system", responses.getFirst().getUsername());
        assertEquals("DELETE", responses.getFirst().getAction());
    }

    @Test
    void getLogsByEntityShouldReturnMappedResponses() {
        User user = TestDataFactory.user(3L, "doc", UserRole.DOCTOR);
        AuditLog log = TestDataFactory.auditLog(9L, user, AuditAction.UPDATE);
        when(auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("Appointment", 5L))
                .thenReturn(List.of(log));

        List<AuditLogResponse> responses = service.getLogsByEntity("Appointment", 5L);

        assertEquals(1, responses.size());
        assertEquals(user.getId(), responses.getFirst().getUserId());
        assertEquals("UPDATE", responses.getFirst().getAction());
    }
}
