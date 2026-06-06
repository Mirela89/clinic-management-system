package com.medicareplus.notificationservice.notification;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private Long userId;
    private String type;
    private String status;
    private String message;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
}