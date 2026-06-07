package com.medicareplus.notificationservice.notification;

import com.medicareplus.notificationservice.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public NotificationResponse createNotification(NotificationRequest request) {
        log.info("Creating notification for userId: {} of type: {}",
                request.getUserId(), request.getType());
        Notification notification = new Notification();
        applyChanges(notification, request, true);
        NotificationResponse response = mapToResponse(notificationRepository.save(notification));
        log.info("Notification created successfully with id: {}", response.getId());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationResponse getNotificationById(Long id) {
        return mapToResponse(findNotification(id));
    }

    @Override
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long id) {
        Notification notification = findNotification(id);
        notification.setStatus(NotificationStatus.READ);
        return mapToResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void deleteNotification(Long id) {
        findNotification(id);
        notificationRepository.deleteById(id);
    }

    private Notification findNotification(Long id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", id));
    }

    private void applyChanges(Notification notification, NotificationRequest request, boolean creating) {
        notification.setUserId(request.getUserId()); // Long in loc de User entity
        notification.setType(request.getType());
        notification.setStatus(request.getStatus());
        notification.setMessage(request.getMessage());
        if (request.getStatus() == NotificationStatus.SENT && notification.getSentAt() == null) {
            notification.setSentAt(LocalDateTime.now());
        }
        if (creating) {
            notification.setCreatedAt(LocalDateTime.now());
        }
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getUserId(), // Long in loc de NotificationUserInfo
                notification.getType().name(),
                notification.getStatus().name(),
                notification.getMessage(),
                notification.getSentAt(),
                notification.getCreatedAt()
        );
    }
}