package com.medicareplus.notification;

import com.medicareplus.user.UserInfoResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class NotificationResponse {

    private Long id;
    private NotificationUserInfo user;
    private String type;
    private String status;
    private String message;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
}
