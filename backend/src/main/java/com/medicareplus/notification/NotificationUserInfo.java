package com.medicareplus.notification;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class NotificationUserInfo {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
}