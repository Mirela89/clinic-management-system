package com.medicareplus.notification;

import com.medicareplus.common.exception.ResourceNotFoundException;
import com.medicareplus.support.TestDataFactory;
import com.medicareplus.user.User;
import com.medicareplus.user.UserRepository;
import com.medicareplus.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationServiceImpl service;

    @Test
    void createNotificationShouldSetSentAtWhenStatusIsSent() {
        User user = TestDataFactory.user(1L, "patient", UserRole.PATIENT);
        NotificationRequest request = new NotificationRequest();
        request.setUserId(1L);
        request.setType(NotificationType.APPOINTMENT_REMINDER);
        request.setStatus(NotificationStatus.SENT);
        request.setMessage("Reminder");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification notification = invocation.getArgument(0);
            notification.setId(10L);
            return notification;
        });

        NotificationResponse response = service.createNotification(request);

        assertEquals(10L, response.getId());
        assertNotNull(response.getSentAt());
        assertNotNull(response.getCreatedAt());
    }

    @Test
    void getAllNotificationsShouldMapResponses() {
        User user = TestDataFactory.user(2L, "patient2", UserRole.PATIENT);
        Notification notification = TestDataFactory.notification(11L, user);
        when(notificationRepository.findAll()).thenReturn(List.of(notification));

        List<NotificationResponse> responses = service.getAllNotifications();

        assertEquals(1, responses.size());
        assertEquals("patient2", responses.getFirst().getUser().getUsername());
    }

    @Test
    void getNotificationsByUserIdShouldValidateUserExists() {
        when(userRepository.findById(3L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getNotificationsByUserId(3L));
    }

    @Test
    void updateNotificationShouldSetSentAtIfMissing() {
        User user = TestDataFactory.user(4L, "patient4", UserRole.PATIENT);
        Notification notification = TestDataFactory.notification(12L, user);
        NotificationRequest request = new NotificationRequest();
        request.setUserId(4L);
        request.setType(NotificationType.PRESCRIPTION_READY);
        request.setStatus(NotificationStatus.SENT);
        request.setMessage("Ready");

        when(notificationRepository.findById(12L)).thenReturn(Optional.of(notification));
        when(userRepository.findById(4L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(notification)).thenReturn(notification);

        NotificationResponse response = service.updateNotification(12L, request);

        assertNotNull(response.getSentAt());
        assertEquals("SENT", response.getStatus());
    }
}
