package com.medicareplus.medicalservice.client;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "notification-service")
public interface NotificationServiceClient {

    @PostMapping("/api/notifications")
    void sendNotification(@RequestBody NotificationRequest request);

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    class NotificationRequest {
        private Long userId;
        private String type;
        private String status;
        private String message;
    }
}