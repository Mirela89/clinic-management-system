package com.medicareplus.common.exception;

import com.medicareplus.common.dto.AppResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 404 - Resource not found exception
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<AppResponse<Void>> handleResourceNotFoundException(
            ResourceNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(AppResponse.error(ex.getMessage()));
    }

    // 400 - Business logic exception
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<AppResponse<Void>> handleBusinessException(
            BusinessException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(AppResponse.error(ex.getMessage()));
    }

    // 400 - Validation exception (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<AppResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(AppResponse.error("Validation error"));
    }

    // 500 - Generic exception handler for unexpected errors
    @ExceptionHandler(Exception.class)
    public ResponseEntity<AppResponse<Void>> handleGenericException(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(AppResponse.error("An unexpected error occured: " + ex.getMessage()));
    }

}
