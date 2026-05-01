package com.medicareplus.notification;

import com.medicareplus.common.exception.ResourceNotFoundException;
import com.medicareplus.user.User;
import com.medicareplus.user.UserInfoResponse;
import com.medicareplus.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public NotificationResponse createNotification(NotificationRequest request) {
        Notification notification = new Notification();
        applyChanges(notification, request, true);

        return mapToResponse(notificationRepository.save(notification));
    }

    @Override
    public NotificationResponse getNotificationById(Long id) {
        return mapToResponse(findNotification(id));
    }

    @Override
    public List<NotificationResponse> getAllNotifications() {
        return notificationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationResponse updateNotification(Long id, NotificationRequest request) {
        Notification notification = findNotification(id);
        applyChanges(notification, request, false);

        return mapToResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void deleteNotification(Long id) {
        Notification notification = findNotification(id);
        notificationRepository.delete(notification);
    }

    private Notification findNotification(Long id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", id));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }

    private void applyChanges(Notification notification, NotificationRequest request, boolean creating) {
        notification.setUser(getUser(request.getUserId()));
        notification.setType(request.getType());
        notification.setStatus(request.getStatus());
        notification.setMessage(request.getMessage());
        notification.setSentAt(request.getSentAt());
        if (creating) {
            notification.setCreatedAt(request.getCreatedAt() != null ? request.getCreatedAt() : LocalDateTime.now());
        } else {
            notification.setCreatedAt(request.getCreatedAt() != null ? request.getCreatedAt() : notification.getCreatedAt());
        }
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                mapUser(notification.getUser()),
                notification.getType().name(),
                notification.getStatus().name(),
                notification.getMessage(),
                notification.getSentAt(),
                notification.getCreatedAt()
        );
    }

    private UserInfoResponse mapUser(User user) {
        return new UserInfoResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getRole().name()
        );
    }
}
