package com.medicareplus.notification;

import java.util.List;

public interface NotificationService {

    NotificationResponse createNotification(NotificationRequest request);

    NotificationResponse getNotificationById(Long id);

    List<NotificationResponse> getAllNotifications();

    NotificationResponse updateNotification(Long id, NotificationRequest request);

    void deleteNotification(Long id);
}
