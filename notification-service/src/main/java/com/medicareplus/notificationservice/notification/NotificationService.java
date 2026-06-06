package com.medicareplus.notificationservice.notification;

import com.medicareplus.notificationservice.notification.NotificationResponse;

import java.util.List;

public interface NotificationService {

    NotificationResponse createNotification(NotificationRequest request);

    NotificationResponse getNotificationById(Long id);

    List<NotificationResponse> getAllNotifications();

    NotificationResponse updateNotification(Long id, NotificationRequest request);

    List<NotificationResponse> getNotificationsByUserId(Long userId);

    NotificationResponse markAsRead(Long id);

    void deleteNotification(Long id);
}
