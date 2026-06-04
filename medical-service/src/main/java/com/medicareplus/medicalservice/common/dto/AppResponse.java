package com.medicareplus.medicalservice.common.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AppResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    // Factory method for success responses
    public static <T> AppResponse<T> success(T data) {
        return new AppResponse<>(true, "Success", data, LocalDateTime.now());
    }

    // Factory method for success responses with custom message
    public static <T> AppResponse<T> success(String message, T data) {
        return new AppResponse<>(true, message, data, LocalDateTime.now());
    }

    // Factory method for error responses
    public static <T> AppResponse<T> error(String message) {
        return new AppResponse<>(false, message, null, LocalDateTime.now());
    }

}
