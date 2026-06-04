package com.medicareplus.medicalservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service")
public interface UserServiceClient {

    @GetMapping("/api/patients/{id}")
    AppResponse<PatientDto> getPatient(@PathVariable Long id);

    @GetMapping("/api/doctors/{id}")
    AppResponse<DoctorDto> getDoctor(@PathVariable Long id);

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    class AppResponse<T> {
        private boolean success;
        private String message;
        private T data;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    class PatientDto {
        private Long userId;
        private UserInfo user;

        // Convenience methods - fara @Getter conflict
        public String getFirstName() {
            return user != null ? user.getFirstName() : "";
        }

        public String getLastName() {
            return user != null ? user.getLastName() : "";
        }

        public String getRole() {
            return user != null ? user.getRole() : "";
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    class DoctorDto {
        private Long userId;
        private UserInfo user;
        private String specialization;

        public String getFirstName() {
            return user != null ? user.getFirstName() : "";
        }

        public String getLastName() {
            return user != null ? user.getLastName() : "";
        }

        public String getRole() {
            return user != null ? user.getRole() : "";
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    class UserInfo {
        private Long id;
        private String firstName;
        private String lastName;
        private String role;
        private String email;
        private String username;
    }
}