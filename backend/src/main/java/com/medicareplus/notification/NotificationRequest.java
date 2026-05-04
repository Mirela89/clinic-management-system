package com.medicareplus.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

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
