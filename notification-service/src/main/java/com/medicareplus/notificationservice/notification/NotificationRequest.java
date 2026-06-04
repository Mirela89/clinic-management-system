package com.medicareplus.notificationservice.notification;

import com.medicareplus.notificationservice.notification.NotificationStatus;
import com.medicareplus.notificationservice.notification.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NotificationRequest {

    @NotNull(message = "User ID is required.")
    private Long userId;

    @NotNull(message = "Notification type is required.")
    private NotificationType type;

    @NotNull(message = "Notification status is required.")
    private NotificationStatus status;

    @NotBlank(message = "Notification message is required.")
    private String message;
}
