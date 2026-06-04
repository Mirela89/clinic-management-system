package com.medicareplus.notification;

import com.medicareplus.common.exception.ResourceNotFoundException;
import com.medicareplus.user.User;
import com.medicareplus.user.UserRepository;
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
    private final UserRepository userRepository;

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
        log.debug("Fetching notification with id: {}", id);
        return mapToResponse(findNotification(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getAllNotifications() {
        log.debug("Fetching all notifications");
        return notificationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationResponse updateNotification(Long id, NotificationRequest request) {
        log.info("Updating notification with id: {}", id);
        Notification notification = findNotification(id);
        applyChanges(notification, request, false);

        NotificationResponse response = mapToResponse(notificationRepository.save(notification));
        log.info("Notification updated successfully with id: {}", id);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsByUserId(Long userId) {
        log.debug("Fetching notifications for userId: {}", userId);
        getUser(userId);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", id));
        notification.setStatus(NotificationStatus.READ);
        return mapToResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void deleteNotification(Long id) {
        log.info("Deleting notification with id: {}", id);
        findNotification(id);
        notificationRepository.deleteById(id);
        log.info("Notification deleted successfully with id: {}", id);
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

        if (request.getStatus() == NotificationStatus.SENT && notification.getSentAt() == null) {
            notification.setSentAt(LocalDateTime.now());
            log.debug("Notification id: {} marked as SENT at: {}", notification.getId(),
                    notification.getSentAt());
        }

        if (creating) {
            notification.setCreatedAt(LocalDateTime.now());
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

    private NotificationUserInfo mapUser(User user) {
        return new NotificationUserInfo(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName()
        );
    }
}